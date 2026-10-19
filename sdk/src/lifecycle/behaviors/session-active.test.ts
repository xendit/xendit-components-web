import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionActiveBehavior } from "./session-active";
import { BlackboardType } from "../behavior-tree";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
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
