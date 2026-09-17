import { streamSession } from "../../../api";
import { BffPollResponse, BffStreamEvent } from "../../../backend-types/common";
import {
  BffPaymentEntity,
  toPaymentEntity,
} from "../../../backend-types/payment-entity";
import { XenditComponents } from "../../../public-sdk";
import { ParsedSdkKey, SLEEP_MULTIPLIER } from "../../../utils";
import { PollWorker } from "./poll-worker";

/**
 * A connection that sends nothing for this long is treated as dead.
 * 3x the server heartbeat interval.
 */
const WATCHDOG_MS = 15_000;

// Drops in a row, with no heartbeat in between, before we stop streaming.
const MAX_DROPS = 3;

// Sent by the server when the stream reaches its maximum duration.
const STREAM_TIMEOUT_CODE = "SESSION_STREAM_TIMEOUT";

type StreamErrorData = Extract<BffStreamEvent, { event: "error" }>["data"];

/**
 * Receives session updates over the session stream until stop() is called.
 * Reopens a healthy connection that goes silent, and falls back to PollWorker if the stream can't be used.
 */
export class StreamWorker {
  started = false;
  stopped = false;

  private source: EventSource | null = null;
  private fallbackWorker: PollWorker | null = null;
  private healthy = false;
  private drops = 0;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  private finish: ((fallback: boolean) => void) | null = null;
  private fail: ((error: unknown) => void) | null = null;

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

    const fallback = await new Promise<boolean>((resolve, reject) => {
      this.finish = resolve;
      this.fail = reject;
      this.openStream();
    });

    // stop() may have run before this resumed
    if (fallback && !this.stopped) {
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
    this.closeStream();
    this.fallbackWorker?.stop();
    this.finish?.(false);
  }

  private openStream() {
    const source = streamSession(
      this.sdkKey,
      this.sdkKey.sessionAuthKey,
      this.sessionTokenRequestId,
    );
    this.source = source;
    this.healthy = false;

    const listen = (name: string, handler: (event: Event) => void) => {
      source.addEventListener(name, (event) => {
        if (this.source === source) {
          handler(event);
        }
      });
    };

    listen("open", () => this.resetWatchdog());
    listen("heartbeat", () => {
      this.healthy = true;
      this.drops = 0;
      this.resetWatchdog();
    });
    listen("update", (event) => this.deliver(event as MessageEvent, false));
    listen("final", (event) => this.deliver(event as MessageEvent, true));
    listen("error", (event) => {
      // only an error event sent by the server carries data
      if (event instanceof MessageEvent) {
        this.handleServerError(event.data);
      } else {
        this.handleDrop(source);
      }
    });
  }

  private deliver(event: MessageEvent, isFinal: boolean) {
    this.resetWatchdog();
    const response = parseJson<BffPollResponse>(event.data);
    if (!response?.session) {
      this.giveUp();
      return;
    }

    try {
      this.onResult(response, getPaymentEntity(response));
    } catch (error) {
      // reject before stop(), which would otherwise resolve start() first
      this.fail?.(error);
      this.stop();
      return;
    }

    // onResult may have stopped this worker
    if (isFinal && !this.stopped) {
      // nothing else is coming, so close before EventSource reconnects
      this.closeStream();
      this.finish?.(false);
    }
  }

  private handleServerError(data: string) {
    const error = parseJson<StreamErrorData>(data);
    // a timeout is expected: the server ends the stream and EventSource reconnects
    if (error?.error_code !== STREAM_TIMEOUT_CODE) {
      this.giveUp();
    }
  }

  private handleDrop(source: EventSource) {
    // EventSource doesn't reconnect after an error response or a wrong content type
    if (source.readyState === source.CLOSED) {
      this.giveUp();
      return;
    }
    // no watchdog while EventSource waits to reconnect, "open" restarts it
    clearTimeout(this.watchdog);
    this.healthy = false;
    this.drops += 1;
    if (this.drops >= MAX_DROPS) {
      this.giveUp();
    }
  }

  private resetWatchdog() {
    clearTimeout(this.watchdog);
    this.watchdog = setTimeout(() => {
      if (this.healthy) {
        // EventSource thinks a silent stream is still connected, so reopen it ourselves
        this.closeStream();
        this.openStream();
      } else {
        this.giveUp();
      }
    }, WATCHDOG_MS * SLEEP_MULTIPLIER);
  }

  private giveUp() {
    this.closeStream();
    this.finish?.(true);
  }

  private closeStream() {
    clearTimeout(this.watchdog);
    this.source?.close();
    this.source = null;
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
