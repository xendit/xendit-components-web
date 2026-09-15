import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { pollSession, streamSession } from "../../../api";
import { BffPollResponse } from "../../../backend-types/common";
import {
  BffPaymentEntity,
  toPaymentEntity,
} from "../../../backend-types/payment-entity";
import { makeTestBffData } from "../../../data/test-data";
import {
  makeTestPaymentRequest,
  makeTestPaymentToken,
  makeTestSdkKey,
} from "../../../data/test-data-modifiers";
import { XenditComponents } from "../../../public-sdk";
import { parseSdkKey, sleep } from "../../../utils";
import { StreamWorker } from "./stream-worker";

// Keep the real module, only replace the two network calls the workers make.
vi.mock("../../../api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../api")>()),
  streamSession: vi.fn(),
  pollSession: vi.fn(),
}));

type OnResult = (
  result: BffPollResponse,
  paymentEntity: BffPaymentEntity | null,
) => void;

const session = makeTestBffData().session;
const sessionOnly: BffPollResponse = { session };
const sdkKey = parseSdkKey(makeTestSdkKey());
const sdk = { isMock: () => false } as unknown as XenditComponents;

/** A stream body the test can push text into, close, or fail. */
function makeFakeStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start: (c) => {
      controller = c;
    },
    cancel: () => {
      cancelled = true;
    },
  });
  const encoder = new TextEncoder();
  return {
    reader: stream.getReader(),
    push: (text: string) => controller.enqueue(encoder.encode(text)),
    close: () => controller.close(),
    // note: error() drops chunks that haven't been read yet
    fail: (error: Error) => controller.error(error),
    isCancelled: () => cancelled,
  };
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

const heartbeat = sse("heartbeat", { timestamp: "2026-09-14T00:00:00Z" });

/** Each call to streamSession returns the next fake stream. */
function queueStreams(count: number) {
  const streams = Array.from({ length: count }, () => makeFakeStream());
  for (const stream of streams) {
    vi.mocked(streamSession).mockResolvedValueOnce(stream.reader);
  }
  return streams;
}

const workers: { stop(): void }[] = [];

function startWorker(onResult: Mock<OnResult> = vi.fn<OnResult>()) {
  const worker = new StreamWorker(sdkKey, sdk, "tok-1", onResult);
  workers.push(worker);
  const done = worker.start();
  return { worker, onResult, done };
}

beforeEach(() => {
  vi.mocked(streamSession).mockReset();
  vi.mocked(pollSession).mockReset();
  vi.mocked(pollSession).mockResolvedValue(sessionOnly);
});

afterEach(() => {
  for (const worker of workers.splice(0)) {
    worker.stop();
  }
});

describe("StreamWorker - normal flow", () => {
  it("delivers an update and keeps the connection open", async () => {
    const [stream] = queueStreams(1);
    const { onResult } = startWorker();

    stream.push(sse("update", sessionOnly));
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    stream.push(sse("update", sessionOnly));
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(2));

    expect(onResult).toHaveBeenCalledWith(sessionOnly, null);
    expect(streamSession).toHaveBeenCalledTimes(1);
    expect(streamSession).toHaveBeenCalledWith(
      sdkKey,
      sdkKey.sessionAuthKey,
      "tok-1",
      expect.anything(),
    );
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("delivers final and finishes without reconnecting", async () => {
    const [stream] = queueStreams(1);
    const { worker, onResult, done } = startWorker();

    stream.push(sse("final", sessionOnly));
    await done;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(streamSession).toHaveBeenCalledTimes(1);
    expect(pollSession).not.toHaveBeenCalled();
    // like PollWorker, only stop() ends isRunning()
    expect(worker.isRunning()).toBe(true);
  });

  it("prefers payment_token over payment_request, like PollWorker", async () => {
    const paymentRequest = makeTestPaymentRequest("MOCK_REDIRECT", "REDIRECT");
    const paymentToken = makeTestPaymentToken("MOCK_REDIRECT", "REDIRECT");
    const [stream] = queueStreams(1);
    const { onResult, done } = startWorker();

    stream.push(sse("update", { session, payment_request: paymentRequest }));
    stream.push(
      sse("final", {
        session,
        payment_request: paymentRequest,
        payment_token: paymentToken,
      }),
    );
    await done;

    expect(onResult.mock.calls[0][1]).toEqual(toPaymentEntity(paymentRequest));
    expect(onResult.mock.calls[1][1]).toEqual(toPaymentEntity(paymentToken));
  });

  it("does not deliver heartbeats or unknown events", async () => {
    const [stream] = queueStreams(1);
    const { onResult, done } = startWorker();

    stream.push(heartbeat);
    stream.push(sse("something-new", { hello: "world" }));
    stream.push(sse("final", sessionOnly));
    await done;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(pollSession).not.toHaveBeenCalled();
  });
});

describe("StreamWorker - reconnect", () => {
  it("reconnects on a stream timeout after a heartbeat", async () => {
    const [first] = queueStreams(2);
    startWorker();

    first.push(heartbeat);
    first.push(
      sse("error", {
        error_code: "SESSION_STREAM_TIMEOUT",
        message: "timeout",
      }),
    );

    await vi.waitFor(() => expect(streamSession).toHaveBeenCalledTimes(2));
    expect(vi.mocked(streamSession).mock.calls[1].slice(0, 3)).toEqual([
      sdkKey,
      sdkKey.sessionAuthKey,
      "tok-1",
    ]);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("reconnects when the server closes a healthy connection", async () => {
    const [first] = queueStreams(2);
    startWorker();

    first.push(heartbeat);
    first.close();

    await vi.waitFor(() => expect(streamSession).toHaveBeenCalledTimes(2));
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("reconnects when a healthy connection drops", async () => {
    const [first] = queueStreams(2);
    const { onResult } = startWorker();

    first.push(heartbeat);
    first.push(sse("update", sessionOnly));
    // fail() drops unread chunks, so wait until both messages were read
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    first.fail(new TypeError("network error"));

    await vi.waitFor(() => expect(streamSession).toHaveBeenCalledTimes(2));
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("reconnects when the watchdog fires on a healthy connection", async () => {
    const [first] = queueStreams(2);
    const { onResult } = startWorker();

    first.push(heartbeat);
    first.push(sse("update", sessionOnly));
    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    // send nothing more, the watchdog (15s * SLEEP_MULTIPLIER) closes it

    await vi.waitFor(() => expect(streamSession).toHaveBeenCalledTimes(2));
    expect(first.isCancelled()).toBe(true);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("does not carry health over to the next connection", async () => {
    const [first, second] = queueStreams(2);
    startWorker();

    first.push(heartbeat);
    first.close();
    await vi.waitFor(() => expect(streamSession).toHaveBeenCalledTimes(2));

    second.push(sse("update", sessionOnly));
    second.close();

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(streamSession).toHaveBeenCalledTimes(2);
  });
});

describe("StreamWorker - fallback", () => {
  it("falls back to polling when the stream can't be opened, and never streams again", async () => {
    vi.mocked(streamSession).mockRejectedValueOnce(
      new Error("Unexpected content type from event stream: text/html"),
    );
    const { onResult } = startWorker();

    await vi.waitFor(() => expect(onResult).toHaveBeenCalledTimes(2));
    expect(pollSession).toHaveBeenCalledWith(
      sdkKey,
      sdkKey.sessionAuthKey,
      "tok-1",
    );
    expect(streamSession).toHaveBeenCalledTimes(1);
  });

  it("falls back instead of looping when closed after an update but before a heartbeat", async () => {
    const [stream] = queueStreams(1);
    startWorker();

    stream.push(sse("update", sessionOnly));
    stream.close();

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(streamSession).toHaveBeenCalledTimes(1);
  });

  it("falls back when the watchdog fires before any message", async () => {
    const [stream] = queueStreams(1);
    startWorker();

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(stream.isCancelled()).toBe(true);
    expect(streamSession).toHaveBeenCalledTimes(1);
  });

  it("falls back on a server error other than timeout, even after a heartbeat", async () => {
    const [stream] = queueStreams(1);
    startWorker();

    stream.push(heartbeat);
    stream.push(
      sse("error", { error_code: "INTERNAL_SERVER_ERROR", message: "boom" }),
    );

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(streamSession).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["an update with invalid JSON", "event: update\ndata: {not json\n\n"],
    ["an update without session", sse("update", {})],
    ["an error with invalid JSON", "event: error\ndata: {not json\n\n"],
  ])("falls back on %s, even after a heartbeat", async (_name, text) => {
    // keep polling pending, so any onResult call could only come from the stream
    vi.mocked(pollSession).mockReturnValue(
      new Promise<BffPollResponse>(() => {}),
    );
    const [stream] = queueStreams(1);
    const { onResult } = startWorker();

    stream.push(heartbeat);
    stream.push(text);

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(onResult).not.toHaveBeenCalled();
    expect(streamSession).toHaveBeenCalledTimes(1);
  });
});

describe("StreamWorker - stop", () => {
  it("stops cleanly when onResult calls stop()", async () => {
    const [stream] = queueStreams(1);
    // eslint-disable-next-line prefer-const
    let worker: StreamWorker;
    const onResult = vi.fn<OnResult>(() => {
      worker.stop();
    });
    const started = startWorker(onResult);
    worker = started.worker;

    stream.push(sse("update", sessionOnly) + sse("update", sessionOnly));
    await started.done;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(worker.isRunning()).toBe(false);
    expect(streamSession).toHaveBeenCalledTimes(1);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("does not read or fall back when stopped while opening", async () => {
    const stream = makeFakeStream();
    let resolveOpen!: (reader: ReadableStreamDefaultReader<Uint8Array>) => void;
    vi.mocked(streamSession).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveOpen = resolve;
      }),
    );
    const { worker, done } = startWorker();

    worker.stop();
    resolveOpen(stream.reader);
    await done;

    expect(stream.isCancelled()).toBe(true);
    expect(streamSession).toHaveBeenCalledTimes(1);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("stops the fallback PollWorker too", async () => {
    vi.mocked(streamSession).mockRejectedValueOnce(new Error("open failed"));
    const { worker, done } = startWorker();
    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());

    worker.stop();
    await done;
    const callsAfterStop = vi.mocked(pollSession).mock.calls.length;
    await sleep(20_000); // 200ms in tests

    expect(pollSession).toHaveBeenCalledTimes(callsAfterStop);
    expect(worker.isRunning()).toBe(false);
  });
});

describe("StreamWorker - errors from onResult", () => {
  it("rethrows an error from onResult instead of falling back", async () => {
    const [stream] = queueStreams(1);
    const { worker, done } = startWorker(
      vi.fn<OnResult>(() => {
        throw new Error("behavior bug");
      }),
    );

    stream.push(heartbeat);
    stream.push(sse("update", sessionOnly));

    await expect(done).rejects.toThrow("behavior bug");
    expect(worker.isRunning()).toBe(false);
    expect(stream.isCancelled()).toBe(true);
    expect(pollSession).not.toHaveBeenCalled();
  });
});
