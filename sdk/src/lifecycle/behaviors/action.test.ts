import { describe, expect, it } from "vitest";
import { makeTestSdkKey } from "../../data/test-data-modifiers";
import { internal } from "../../internal";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { parseSdkKey } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";

// The shared action logic
class TestActionBehavior extends ContainerActionBehavior {}

function buildSdk(prodLive = true) {
  return Object.assign(new EventTarget(), {
    isProdLive: () => prodLive,
    [internal]: { liveComponents: { actionInstructionsContainer: null } },
  });
}

function buildBlackboard(
  sdk: EventTarget,
  events: Event[] = [],
  overrides: Record<string, unknown> = {},
): BlackboardType {
  return {
    sdk,
    sdkKey: parseSdkKey(makeTestSdkKey()),
    mock: false,
    world: { experiments: {} },
    pollImmediatelyRequested: false,
    simulatePaymentRequested: false,
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("ContainerActionBehavior.affirmPayment", () => {
  it("asks for an immediate poll in prod live", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(buildSdk(true), events);
    const behavior = new TestActionBehavior(bb);

    behavior.affirmPayment();

    expect(bb.pollImmediatelyRequested).toBe(true);
    expect(bb.simulatePaymentRequested).toBe(false);
    expect(events.map((e) => e.type)).toEqual([
      InternalBehaviorTreeUpdateEvent.type,
    ]);
  });

  it("asks for a simulated payment outside prod live", () => {
    const bb = buildBlackboard(buildSdk(false));
    const behavior = new TestActionBehavior(bb);

    behavior.affirmPayment();

    expect(bb.simulatePaymentRequested).toBe(true);
    expect(bb.pollImmediatelyRequested).toBe(false);
  });
});

describe("ContainerActionBehavior.isStreamingEnabled", () => {
  it("is on in mock mode, even with the flag off", () => {
    const behavior = new TestActionBehavior(
      buildBlackboard(buildSdk(), [], {
        mock: true,
        world: { experiments: { "stream-session": false } },
      }),
    );

    expect(behavior.isStreamingEnabled()).toBe(true);
  });

  it("is on when the stream-session flag is true", () => {
    const behavior = new TestActionBehavior(
      buildBlackboard(buildSdk(), [], {
        world: { experiments: { "stream-session": true } },
      }),
    );

    expect(behavior.isStreamingEnabled()).toBe(true);
  });

  it("is off when the flag is missing", () => {
    const behavior = new TestActionBehavior(buildBlackboard(buildSdk()));

    expect(behavior.isStreamingEnabled()).toBe(false);
  });
});
