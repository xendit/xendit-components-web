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

// A stand-in for EventSource, which jsdom doesn't implement
class FakeEventSource extends EventTarget {
  readonly CLOSED = 2;
  readyState = 0;
  closed = false;

  // The server accepted the connection.
  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }

  // A named event from the serve.
  send(eventName: string, data: unknown) {
    const text = typeof data === "string" ? data : JSON.stringify(data);
    this.dispatchEvent(new MessageEvent(eventName, { data: text }));
  }

  // The connection dropped; a real EventSource would reconnect.
  drop() {
    this.readyState = 0;
    this.dispatchEvent(new Event("error"));
  }

  // The server refused the stream; a real EventSource gives up.
  reject() {
    this.readyState = this.CLOSED;
    this.dispatchEvent(new Event("error"));
  }

  close() {
    this.readyState = this.CLOSED;
    this.closed = true;
  }
}

// Each call to streamSession returns the next fake source.
function queueSources(count: number) {
  const sources = Array.from({ length: count }, () => new FakeEventSource());
  for (const source of sources) {
    vi.mocked(streamSession).mockReturnValueOnce(
      source as unknown as EventSource,
    );
  }
  return sources;
}

const heartbeat = { timestamp: "2026-09-14T00:00:00Z" };

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
  it("delivers an update and keeps the connection open", () => {
    const [source] = queueSources(1);
    const { onResult } = startWorker();

    source.open();
    source.send("update", sessionOnly);
    source.send("update", sessionOnly);

    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onResult).toHaveBeenCalledWith(sessionOnly, null);
    expect(source.closed).toBe(false);
    expect(streamSession).toHaveBeenCalledTimes(1);
    expect(streamSession).toHaveBeenCalledWith(
      sdkKey,
      sdkKey.sessionAuthKey,
      "tok-1",
    );
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("closes the stream after final without falling back", async () => {
    const [source] = queueSources(1);
    const { worker, onResult, done } = startWorker();

    source.send("final", sessionOnly);
    await done;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(source.closed).toBe(true);
    expect(pollSession).not.toHaveBeenCalled();
    // like PollWorker, only stop() ends isRunning()
    expect(worker.isRunning()).toBe(true);
  });

  it("prefers payment_token over payment_request, like PollWorker", async () => {
    const paymentRequest = makeTestPaymentRequest("MOCK_REDIRECT", "REDIRECT");
    const paymentToken = makeTestPaymentToken("MOCK_REDIRECT", "REDIRECT");
    const [source] = queueSources(1);
    const { onResult, done } = startWorker();

    source.send("update", { session, payment_request: paymentRequest });
    source.send("final", {
      session,
      payment_request: paymentRequest,
      payment_token: paymentToken,
    });
    await done;

    expect(onResult.mock.calls[0][1]).toEqual(toPaymentEntity(paymentRequest));
    expect(onResult.mock.calls[1][1]).toEqual(toPaymentEntity(paymentToken));
  });

  it("does not deliver heartbeats or unknown events", async () => {
    const [source] = queueSources(1);
    const { onResult, done } = startWorker();

    source.send("heartbeat", heartbeat);
    source.send("something-new", { hello: "world" });
    source.send("final", sessionOnly);
    await done;

    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

describe("StreamWorker - recovery", () => {
  it("keeps listening after a stream timeout, leaving the reconnect to EventSource", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.open();
    source.send("heartbeat", heartbeat);
    source.send("error", {
      error_code: "SESSION_STREAM_TIMEOUT",
      message: "timeout",
    });
    source.drop(); // the server ends the response after the timeout
    await sleep(1_000);

    expect(source.closed).toBe(false);
    expect(streamSession).toHaveBeenCalledTimes(1);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("tolerates drops below the limit", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.drop();
    source.drop();
    await sleep(1_000);

    expect(source.closed).toBe(false);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("forgets earlier drops once a heartbeat arrives", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.drop();
    source.drop();
    source.open();
    source.send("heartbeat", heartbeat);
    source.drop();
    source.drop();
    await sleep(1_000);

    expect(source.closed).toBe(false);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("reopens the stream itself when a healthy connection goes silent", async () => {
    const [first, second] = queueSources(2);
    startWorker();

    first.open();
    first.send("heartbeat", heartbeat);
    // nothing more, so the watchdog (15s * SLEEP_MULTIPLIER) reopens the stream

    await vi.waitFor(() => expect(streamSession).toHaveBeenCalledTimes(2));
    expect(first.closed).toBe(true);
    expect(second.closed).toBe(false);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("needs a new heartbeat after reconnecting before it counts as healthy", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.open();
    source.send("heartbeat", heartbeat);
    source.drop();
    source.open(); // EventSource reconnected, but the server stays silent

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(source.closed).toBe(true);
    expect(streamSession).toHaveBeenCalledTimes(1);
  });
});

describe("StreamWorker - fallback", () => {
  it("falls back to polling after three drops in a row, and never streams again", async () => {
    const [source] = queueSources(1);
    const { onResult } = startWorker();

    source.drop();
    source.drop();
    source.drop();

    await vi.waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(pollSession).toHaveBeenCalledWith(
      sdkKey,
      sdkKey.sessionAuthKey,
      "tok-1",
    );
    expect(source.closed).toBe(true);
    expect(streamSession).toHaveBeenCalledTimes(1);
  });

  it("falls back right away when the server refuses the stream", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.reject(); // e.g. the session is gone or the origin isn't allowed

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(source.closed).toBe(true);
  });

  it("falls back when the connection stays silent before any heartbeat", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.open();

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(source.closed).toBe(true);
    expect(streamSession).toHaveBeenCalledTimes(1);
  });

  it("does not let updates without heartbeats keep a dropping stream alive", async () => {
    // keep polling pending, so any onResult call could only come from the stream
    vi.mocked(pollSession).mockReturnValue(
      new Promise<BffPollResponse>(() => {}),
    );
    const [source] = queueSources(1);
    const { onResult } = startWorker();

    for (let i = 0; i < 3; i++) {
      source.open();
      source.send("update", sessionOnly);
      source.drop();
    }

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(onResult).toHaveBeenCalledTimes(3);
    expect(source.closed).toBe(true);
  });

  it("falls back on a server error other than a timeout, even after a heartbeat", async () => {
    const [source] = queueSources(1);
    startWorker();

    source.send("heartbeat", heartbeat);
    source.send("error", {
      error_code: "INTERNAL_SERVER_ERROR",
      message: "boom",
    });

    await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
    expect(source.closed).toBe(true);
  });

  it.each([
    ["an update with invalid JSON", "update", "{not json"],
    ["an update without a session", "update", "{}"],
    ["an error with invalid JSON", "error", "{not json"],
  ])(
    "falls back on %s, even after a heartbeat",
    async (_name, eventName, data) => {
      // keep polling pending, so any onResult call could only come from the stream
      vi.mocked(pollSession).mockReturnValue(
        new Promise<BffPollResponse>(() => {}),
      );
      const [source] = queueSources(1);
      const { onResult } = startWorker();

      source.send("heartbeat", heartbeat);
      source.send(eventName, data);

      await vi.waitFor(() => expect(pollSession).toHaveBeenCalled());
      expect(onResult).not.toHaveBeenCalled();
      expect(streamSession).toHaveBeenCalledTimes(1);
    },
  );
});

describe("StreamWorker - stop", () => {
  it("stops cleanly when onResult calls stop()", async () => {
    const [source] = queueSources(1);
    // eslint-disable-next-line prefer-const
    let worker: StreamWorker;
    const onResult = vi.fn<OnResult>(() => {
      worker.stop();
    });
    const started = startWorker(onResult);
    worker = started.worker;

    source.send("update", sessionOnly);
    source.send("update", sessionOnly);
    await started.done;

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(worker.isRunning()).toBe(false);
    expect(source.closed).toBe(true);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("does not fall back when stopped right after starting", async () => {
    const [source] = queueSources(1);
    const { worker, done } = startWorker();

    worker.stop();
    await done;

    expect(source.closed).toBe(true);
    expect(pollSession).not.toHaveBeenCalled();
  });

  it("does not start polling when stopped as the stream gives up", async () => {
    const [source] = queueSources(1);
    const { worker, done } = startWorker();

    source.reject();
    worker.stop(); // runs before start() resumes to create the PollWorker
    await done;
    await sleep(1_000);

    expect(pollSession).not.toHaveBeenCalled();
  });

  it("stops the fallback PollWorker too", async () => {
    const [source] = queueSources(1);
    const { worker, done } = startWorker();
    source.reject();
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
    const [source] = queueSources(1);
    const { worker, done } = startWorker(
      vi.fn<OnResult>(() => {
        throw new Error("behavior bug");
      }),
    );

    source.send("heartbeat", heartbeat);
    source.send("update", sessionOnly);

    await expect(done).rejects.toThrow("behavior bug");
    expect(worker.isRunning()).toBe(false);
    expect(source.closed).toBe(true);
    expect(pollSession).not.toHaveBeenCalled();
  });
});
