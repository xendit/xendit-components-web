import { describe, expect, it } from "vitest";
import { makeTestSdkKey } from "../../data/test-data-modifiers";
import { internal } from "../../internal";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalSessionStatusCheckedEvent,
} from "../../private-event-types";
import { parseSdkKey } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ActionQrBehavior } from "./action-qr";

function buildSdk() {
  return Object.assign(new EventTarget(), {
    isProdLive: () => true,
    [internal]: { liveComponents: { actionInstructionsContainer: null } },
  });
}

function buildBlackboard(sdk: EventTarget, events: Event[]): BlackboardType {
  return {
    sdk,
    sdkKey: parseSdkKey(makeTestSdkKey()),
    pollImmediatelyRequested: false,
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// lets pending promise callbacks run
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function track(promise: Promise<void>) {
  const state = { resolved: false };
  promise.then(() => {
    state.resolved = true;
  });
  return state;
}

describe("ActionQrBehavior.checkStatus", () => {
  it("asks for an immediate check, like the old affirm button", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(buildSdk(), events);
    const behavior = new ActionQrBehavior(bb, "0");

    behavior.checkStatus();

    expect(bb.pollImmediatelyRequested).toBe(true);
    expect(events.map((e) => e.type)).toEqual([
      InternalBehaviorTreeUpdateEvent.type,
    ]);
  });

  it("resolves on the next status check, not before", async () => {
    const sdk = buildSdk();
    const behavior = new ActionQrBehavior(buildBlackboard(sdk, []), "0");

    const check = track(behavior.checkStatus());
    await flush();
    expect(check.resolved).toBe(false);

    sdk.dispatchEvent(new InternalSessionStatusCheckedEvent());
    await flush();
    expect(check.resolved).toBe(true);
  });

  it("waits for a new answer when checked again after an answer", async () => {
    const sdk = buildSdk();
    const behavior = new ActionQrBehavior(buildBlackboard(sdk, []), "0");

    behavior.checkStatus();
    sdk.dispatchEvent(new InternalSessionStatusCheckedEvent());
    const second = track(behavior.checkStatus());
    await flush();
    expect(second.resolved).toBe(false);

    sdk.dispatchEvent(new InternalSessionStatusCheckedEvent());
    await flush();
    expect(second.resolved).toBe(true);
  });

  it("never resolves after the screen closes, so no result is shown", async () => {
    const sdk = buildSdk();
    const behavior = new ActionQrBehavior(buildBlackboard(sdk, []), "0");

    const check = track(behavior.checkStatus());
    behavior.exit();
    sdk.dispatchEvent(new InternalSessionStatusCheckedEvent());
    await flush();

    expect(check.resolved).toBe(false);
  });
});
