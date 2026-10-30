import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionActiveBehavior } from "./session-active";
import { BlackboardType } from "../behavior-tree";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import {
  XenditCurrentChannelChangedEvent,
  XenditWillSavePaymentMethodEvent,
} from "../../public-event-types";
import { makeTestBffData } from "../../data/test-data";

const testData = makeTestBffData();

// a session with a 10 minute TTL, received now
function buildBlackboard(events: Event[]): BlackboardType {
  return {
    world: {
      session: { ...testData.session, status: "ACTIVE", expires_ttl: 600 },
    },
    sessionRecvTime: Date.now(),
    channel: null,
    currentChannelCode: null,
    telemetry: {
      expectingRedirectAway: false,
      appendAndPushScope: vi.fn(),
      popScope: vi.fn(),
    },
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function treeUpdates(events: Event[]) {
  return events.filter(
    (event) => event instanceof InternalBehaviorTreeUpdateEvent,
  );
}

describe("SessionActiveBehavior expiry timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("wakes the behavior tree when the TTL runs out", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(buildBlackboard(events));

    behavior.enter();
    vi.advanceTimersByTime(599_999);
    expect(treeUpdates(events)).toHaveLength(0);

    vi.advanceTimersByTime(1);
    expect(treeUpdates(events)).toHaveLength(1);
  });

  it("moves the timeout when the server sends the session again", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    vi.advanceTimersByTime(300_000);
    bb.sessionRecvTime = Date.now(); // the same 10 minute TTL, received again
    behavior.updatePreorder();

    vi.advanceTimersByTime(300_000);
    expect(treeUpdates(events)).toHaveLength(0);

    vi.advanceTimersByTime(300_000);
    expect(treeUpdates(events)).toHaveLength(1);
  });

  it("stops on exit", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(buildBlackboard(events));

    behavior.enter();
    vi.advanceTimersByTime(300_000);
    behavior.exit();
    vi.advanceTimersByTime(600_000);

    expect(treeUpdates(events)).toHaveLength(0);
  });
});

describe("SessionActiveBehavior current-channel-changed", () => {
  it("fires when the current channel changes", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    bb.currentChannelCode = "MOCK_QR";
    behavior.updatePreorder();
    behavior.updatePreorder();
    bb.currentChannelCode = null;
    behavior.updatePreorder();
    behavior.exit();

    const channelCodes = events
      .filter((event) => event instanceof XenditCurrentChannelChangedEvent)
      .map((event) => event.channelCode);
    expect(channelCodes).toEqual(["MOCK_QR", null]);
  });
});

describe("SessionActiveBehavior will-save-payment-method", () => {
  const saveOk = testData.channels.find(
    (ch) => ch.channel_code === "UI_SAVE_PAYMENT_DETAILS_TEST",
  )!;

  it("fires when the answer changes", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    bb.currentChannelCode = saveOk.channel_code;
    bb.channel = saveOk;
    bb.channelData = {
      savePaymentMethod: false,
    } as BlackboardType["channelData"];
    behavior.updatePreorder();
    bb.channelData = {
      savePaymentMethod: true,
    } as BlackboardType["channelData"];
    behavior.updatePreorder();
    behavior.updatePreorder();
    // clearing the channel also clears the blackboard's channel and data
    bb.currentChannelCode = null;
    bb.channel = null;
    bb.channelData = null;
    behavior.updatePreorder();
    behavior.exit();

    const values = events
      .filter((event) => event instanceof XenditWillSavePaymentMethodEvent)
      .map((event) => event.willSavePaymentMethod);
    expect(values).toEqual([true, false]);
  });

  it("reports the digital wallet's value during a wallet submission", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    // a wallet submission has no current channel, but fills the channel and data
    bb.currentChannelCode = null;
    bb.channelIsDigitalWallet = true;
    bb.channel = saveOk;
    bb.channelData = {
      savePaymentMethod: true,
    } as BlackboardType["channelData"];
    behavior.updatePreorder();
    behavior.exit();

    const values = events
      .filter((event) => event instanceof XenditWillSavePaymentMethodEvent)
      .map((event) => event.willSavePaymentMethod);
    expect(values).toEqual([true]);
  });

  it("fires after current-channel-changed", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    bb.currentChannelCode = saveOk.channel_code;
    bb.channel = saveOk;
    bb.channelData = {
      savePaymentMethod: true,
    } as BlackboardType["channelData"];
    behavior.updatePreorder();
    behavior.exit();

    const types = events
      .filter(
        (event) =>
          event instanceof XenditCurrentChannelChangedEvent ||
          event instanceof XenditWillSavePaymentMethodEvent,
      )
      .map((event) => event.type);
    expect(types).toEqual([
      "current-channel-changed",
      "will-save-payment-method",
    ]);
  });
});
