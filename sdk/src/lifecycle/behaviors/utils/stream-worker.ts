import { streamSession } from "../../../api";
import { BffPollResponse, BffStreamEvent } from "../../../backend-types/common";
import {
  BffPaymentEntity,
  toPaymentEntity,
} from "../../../backend-types/payment-entity";
import { XenditComponents } from "../../../public-sdk";
import { parseSseChunk, SseMessage } from "../../../sse";
import { ParsedSdkKey, SLEEP_MULTIPLIER } from "../../../utils";
import { PollWorker } from "./poll-worker";

/**
 * A connection that sends nothing for this long is treated as dead.
 * 3x the server heartbeat interval.
 */
const WATCHDOG_MS = 15_000;

// Sent by the server when the stream reaches its maximum duration.
const STREAM_TIMEOUT_CODE = "SESSION_STREAM_TIMEOUT";

type StreamErrorData = Extract<BffStreamEvent, { event: "error" }>["data"];

// How one connection ended.
type ConnectionResult = "final" | "reconnect" | "fallback" | "stopped";

// Outcome of one message. "ended" means the connection ended, not the worker.
type MessageResult = "continue" | "heartbeat" | "final" | "ended" | "fallback";

// Wraps an error- thrown by onResult, so it isn't mistaken for a stream failure.
class OnResultError extends Error {
  constructor(public readonly original: unknown) {
    super("onResult threw an error");
  }
}

/**
 * Receives session updates over the session stream until stop() is called.
 * Reopens a healthy connection that ends, and falls back to PollWorker if the stream can't be used.
 */
export class StreamWorker {
  started = false;
  stopped = false;

  private abortController: AbortController | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private fallbackWorker: PollWorker | null = null;

  constructor(
    private sdkKey: ParsedSdkKey,
    private sdk: XenditComponents,
    private sessionTokenRequestId: string | null,
    private onResult: (
      result: BffPollResponse,
      paymentEntity: BffPaymentEntity | null,
    ) => void,
  ) {}

  async start() {
    if (this.stopped) {
      throw new Error(
        "StreamWorker has been stopped, make a new instance instead of calling start again",
      );
    }
    this.started = true;

    let result: ConnectionResult;
    do {
      result = await this.runConnection();
    } while (result === "reconnect");

    if (result === "fallback") {
      this.fallbackWorker = new PollWorker(
        this.sdkKey,
        this.sdk,
        this.sessionTokenRequestId,
        this.onResult,
      );
      await this.fallbackWorker.start();
    }
  }

  isRunning() {
    return this.started && !this.stopped;
  }

  stop() {
    this.started = false;
    this.stopped = true;
    this.closeConnection();
    this.fallbackWorker?.stop();
  }

  private async runConnection(): Promise<ConnectionResult> {
    const abortController = new AbortController();
    this.abortController = abortController;
    let healthy = false;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const resetWatchdog = () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(
        () => this.closeConnection(),
        WATCHDOG_MS * SLEEP_MULTIPLIER,
      );
    };

    try {
      const reader = await streamSession(
        this.sdkKey,
        this.sdkKey.sessionAuthKey,
        this.sessionTokenRequestId,
        abortController.signal,
      );
      this.reader = reader;
      if (this.stopped) return "stopped";

      resetWatchdog();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (this.stopped) return "stopped";
        if (done) return healthy ? "reconnect" : "fallback";

        buffer += decoder.decode(value, { stream: true });
        const { messages, rest } = parseSseChunk(buffer);
        buffer = rest;

        for (const message of messages) {
          resetWatchdog();
          const messageResult = this.handleMessage(message);
          // onResult may have stopped this worker
          if (this.stopped) return "stopped";

          if (messageResult === "heartbeat") {
            healthy = true;
          } else if (messageResult === "ended") {
            return healthy ? "reconnect" : "fallback";
          } else if (messageResult !== "continue") {
            return messageResult;
          }
        }
      }
    } catch (error) {
      if (error instanceof OnResultError) {
        this.stop();
        throw error.original;
      }
      // errors caused by stop() are expected
      if (this.stopped) return "stopped";
      return healthy ? "reconnect" : "fallback";
    } finally {
      clearTimeout(watchdog);
      this.closeConnection();
    }
  }

  private handleMessage(message: SseMessage): MessageResult {
    switch (message.event) {
      case "heartbeat":
        return "heartbeat";
      case "update":
      case "final": {
        const response = parseJson<BffPollResponse>(message.data);
        if (!response?.session) {
          return "fallback";
        }
        try {
          this.onResult(response, getPaymentEntity(response));
        } catch (error) {
          throw new OnResultError(error);
        }
        return message.event === "final" ? "final" : "continue";
      }
      case "error": {
        const data = parseJson<StreamErrorData>(message.data);
        return data?.error_code === STREAM_TIMEOUT_CODE ? "ended" : "fallback";
      }
      default:
        // ignore unknown events
        return "continue";
    }
  }

  private closeConnection() {
    this.abortController?.abort();
    // cancelling also wakes up a pending read()
    this.reader?.cancel().catch(() => {});
    this.abortController = null;
    this.reader = null;
  }
}

function parseJson<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch (_err) {
    return null;
  }
}

function getPaymentEntity(response: BffPollResponse): BffPaymentEntity | null {
  if (response.payment_token) {
    return toPaymentEntity(response.payment_token);
  }
  if (response.payment_request) {
    return toPaymentEntity(response.payment_request);
  }
  return null;
}
