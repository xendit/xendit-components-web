import { describe, expect, it } from "vitest";
import { BlackboardType } from "../../behavior-tree";
import { parseSdkKey } from "../../../utils";
import { makeTestSdkKey } from "../../../data/test-data-modifiers";
import { createSessionUpdateWorker } from "./session-update-worker";
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
