import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionActiveBehavior } from "./session-active";
import { BlackboardType } from "../behavior-tree";
import { BffSession } from "../../backend-types/session";
import { InternalUpdateWorldState } from "../../private-event-types";
import { makeTestBffData } from "../../data/test-data";

const testData = makeTestBffData();

function activeSession(expiresTtl: number | undefined): BffSession {
  return { ...testData.session, status: "ACTIVE", expires_ttl: expiresTtl };
}

// Like the SDK, the session from InternalUpdateWorldState is written to bb.world, so later checks see it.
function buildBlackboard(
  session: BffSession,
  events: Event[],
  overrides: Partial<BlackboardType> = {},
): BlackboardType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bb: any = {
    world: { session },
    channel: null,
    submissionRequested: false,
    telemetry: {
      expectingRedirectAway: false,
      append: vi.fn(),
      appendAndPushScope: vi.fn(),
      popScope: vi.fn(),
    },
    dispatchEvent: (event: Event) => {
      events.push(event);
      if (event instanceof InternalUpdateWorldState && event.data.session) {
        bb.world = { ...bb.world, session: event.data.session };
      }
      return true;
    },
    ...overrides,
  };
  return bb;
}

function expiryUpdates(events: Event[]) {
  return events.filter(
    (event): event is InternalUpdateWorldState =>
      event instanceof InternalUpdateWorldState &&
      event.data.session?.status === "EXPIRED",
  );
}

describe("SessionActiveBehavior expiry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("expires the session when the TTL runs out with no submission in progress", () => {
    const events: Event[] = [];
    const session = activeSession(600);
    const behavior = new SessionActiveBehavior(
      buildBlackboard(session, events),
    );

    behavior.enter();
    vi.advanceTimersByTime(599_999);
    expect(expiryUpdates(events)).toHaveLength(0);

    vi.advanceTimersByTime(1);
    const updates = expiryUpdates(events);
    expect(updates).toHaveLength(1);
    expect(updates[0].data.session).toEqual({
      ...session,
      status: "EXPIRED",
      expires_ttl: 0,
    });
  });

  it("does nothing when the server sends no TTL", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(
      buildBlackboard(activeSession(undefined), events),
    );

    behavior.enter();
    vi.advanceTimersByTime(2_147_483_647);

    expect(expiryUpdates(events)).toHaveLength(0);
  });

  it("expires on enter when the TTL is already zero", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(
      buildBlackboard(activeSession(0), events),
    );

    behavior.enter();

    expect(expiryUpdates(events)).toHaveLength(1);
  });

  it("waits while a submission is in progress, then expires once it ends", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(activeSession(600), events, {
      submissionRequested: "normal",
    });
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    vi.advanceTimersByTime(600_000);
    expect(expiryUpdates(events)).toHaveLength(0);

    bb.submissionRequested = false;
    behavior.updatePreorder();
    expect(expiryUpdates(events)).toHaveLength(1);
  });

  it("keeps counting when an update carries the same session object", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(
      buildBlackboard(activeSession(600), events),
    );

    behavior.enter();
    vi.advanceTimersByTime(300_000);
    behavior.updatePreorder();
    vi.advanceTimersByTime(300_000);

    expect(expiryUpdates(events)).toHaveLength(1);
  });

  it("restarts the countdown when a new session arrives", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(activeSession(600), events);
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    vi.advanceTimersByTime(300_000);
    bb.world = { ...bb.world!, session: activeSession(600) };
    behavior.updatePreorder();

    vi.advanceTimersByTime(300_000);
    expect(expiryUpdates(events)).toHaveLength(0);

    vi.advanceTimersByTime(300_000);
    expect(expiryUpdates(events)).toHaveLength(1);
  });

  it("stops counting on exit", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(
      buildBlackboard(activeSession(600), events),
    );

    behavior.enter();
    vi.advanceTimersByTime(300_000);
    behavior.exit();
    vi.advanceTimersByTime(600_000);

    expect(expiryUpdates(events)).toHaveLength(0);
  });

  it("expires once a failed submission ends and the server sent a zero TTL", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(activeSession(600), events, {
      submissionRequested: "normal",
    });
    const behavior = new SessionActiveBehavior(bb);

    behavior.enter();
    vi.advanceTimersByTime(700_000);

    // first tree pass: the failed payment's session arrives, the submission flag is still set
    bb.world = { ...bb.world!, session: activeSession(0) };
    behavior.updatePreorder();
    expect(expiryUpdates(events)).toHaveLength(0);

    // second tree pass: PaymentEntityFailedBehavior cleared the flag
    bb.submissionRequested = false;
    behavior.updatePreorder();
    expect(expiryUpdates(events)).toHaveLength(1);
  });

  it("expires only once when the timer and a later update both see the deadline", () => {
    const events: Event[] = [];
    const behavior = new SessionActiveBehavior(
      buildBlackboard(activeSession(600), events),
    );

    behavior.enter();
    vi.advanceTimersByTime(600_000);
    behavior.updatePreorder();

    expect(expiryUpdates(events)).toHaveLength(1);
  });
});
