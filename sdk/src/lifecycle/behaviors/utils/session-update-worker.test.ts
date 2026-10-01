import { describe, expect, it } from "vitest";
import { BlackboardType } from "../../behavior-tree";
import { parseSdkKey } from "../../../utils";
import { makeTestSdkKey } from "../../../data/test-data-modifiers";
import {
  createSessionUpdateWorker,
  StreamFallbackReason,
} from "./session-update-worker";
import { PollWorker } from "./poll-worker";
import { StreamWorker } from "./stream-worker";

function buildBlackboard(
  overrides: Partial<BlackboardType>,
  experiments?: Record<string, unknown>,
): BlackboardType {
  return {
    sdk: { isMock: () => false },
    mock: false,
    sdkKey: parseSdkKey(makeTestSdkKey()),
    world: {
      sessionTokenRequestId: "tok-1",
      experiments: experiments ?? { "stream-session": true },
    },
    redirectReturnPending: false,
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

const noop = () => {};

describe("createSessionUpdateWorker", () => {
  it("uses the stream when not mock, not returning from a redirect, and the flag is true", () => {
    const worker = createSessionUpdateWorker(buildBlackboard({}), noop);

    expect(worker).toBeInstanceOf(StreamWorker);
  });

  it("streams in mock mode", () => {
    const worker = createSessionUpdateWorker(
      buildBlackboard(
        { mock: true, redirectReturnPending: true },
        { "stream-session": false },
      ),
      noop,
    );

    expect(worker).toBeInstanceOf(StreamWorker);
  });

  it("polls right after the buyer returns from a redirect", () => {
    const worker = createSessionUpdateWorker(
      buildBlackboard({ redirectReturnPending: true }),
      noop,
    );

    expect(worker).toBeInstanceOf(PollWorker);
  });

  it("polls when the flag is false", () => {
    const worker = createSessionUpdateWorker(
      buildBlackboard({}, { "stream-session": false }),
      noop,
    );

    expect(worker).toBeInstanceOf(PollWorker);
  });

  it("polls without throwing when experiments is missing", () => {
    const bb = buildBlackboard({});
    // existing behavior test fixtures don't have experiments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (bb.world as any).experiments;

    expect(createSessionUpdateWorker(bb, noop)).toBeInstanceOf(PollWorker);
  });

  it("polls when the flag is the string 'true' instead of a boolean", () => {
    const worker = createSessionUpdateWorker(
      buildBlackboard({}, { "stream-session": "true" }),
      noop,
    );

    expect(worker).toBeInstanceOf(PollWorker);
  });

  it("polls when world is null", () => {
    const worker = createSessionUpdateWorker(
      buildBlackboard({ world: null }),
      noop,
    );

    expect(worker).toBeInstanceOf(PollWorker);
  });
});

describe("createSessionUpdateWorker - session update summary", () => {
  it("records the stream", () => {
    const bb = buildBlackboard({});

    createSessionUpdateWorker(bb, noop);

    expect(bb.sessionUpdateSummary).toEqual({ mode: "stream" });
  });

  it("records poll when the flag is false", () => {
    const bb = buildBlackboard({}, { "stream-session": false });

    createSessionUpdateWorker(bb, noop);

    expect(bb.sessionUpdateSummary).toEqual({ mode: "poll" });
  });

  it("takes the latest worker's mode, e.g. poll right after a redirect return", () => {
    const bb = buildBlackboard({});
    createSessionUpdateWorker(bb, noop);

    bb.redirectReturnPending = true;
    createSessionUpdateWorker(bb, noop);

    expect(bb.sessionUpdateSummary).toEqual({ mode: "poll" });
  });

  it("records a fallback with its reason", () => {
    const bb = buildBlackboard({});
    const worker = createSessionUpdateWorker(bb, noop);

    fallBack(worker, "too_many_drops");

    expect(bb.sessionUpdateSummary).toEqual({
      mode: "stream_fallback_poll",
      fallbackReason: "too_many_drops",
    });
  });

  it("forgets an earlier fallback when a later worker streams", () => {
    const bb = buildBlackboard({});
    const worker = createSessionUpdateWorker(bb, noop);
    fallBack(worker, "too_many_drops");

    createSessionUpdateWorker(bb, noop);

    expect(bb.sessionUpdateSummary).toEqual({ mode: "stream" });
  });
});

// what StreamWorker calls on fallback
function fallBack(worker: unknown, reason: StreamFallbackReason) {
  (worker as { onFallback: (reason: StreamFallbackReason) => void }).onFallback(
    reason,
  );
}
