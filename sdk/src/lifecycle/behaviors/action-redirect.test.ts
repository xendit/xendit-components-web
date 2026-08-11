import { describe, expect, it } from "vitest";
import { ActionRedirectBehavior } from "./action-redirect";
import { BlackboardType } from "../behavior-tree";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { XenditWillRedirectEvent } from "../../public-event-types";

const HASH_URL = "#mock-redirect-target";

function buildBlackboard(events: Event[]): BlackboardType {
  return {
    redirectReturnPending: false,
    pollImmediatelyRequested: false,
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// Dispatches a pageshow event with an `persisted` value
function firePageShow(persisted: boolean) {
  const event = new Event("pageshow");
  Object.defineProperty(event, "persisted", { value: persisted });
  window.dispatchEvent(event);
}

describe("ActionRedirectBehavior bfcache return", () => {
  it("raises the recovery flags when the page is restored from bfcache", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new ActionRedirectBehavior(bb, HASH_URL);

    behavior.enter();
    firePageShow(true);

    expect(bb.redirectReturnPending).toBe(true);
    expect(bb.pollImmediatelyRequested).toBe(true);
    expect(
      events.some((e) => e.type === InternalBehaviorTreeUpdateEvent.type),
    ).toBe(true);

    behavior.exit();
  });

  it("ignores a pageshow that is not a bfcache restoration", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new ActionRedirectBehavior(bb, HASH_URL);

    behavior.enter();
    firePageShow(false);

    expect(bb.redirectReturnPending).toBe(false);
    expect(bb.pollImmediatelyRequested).toBe(false);
    expect(
      events.some((e) => e.type === InternalBehaviorTreeUpdateEvent.type),
    ).toBe(false);

    behavior.exit();
  });

  it("stops listening after exit, so a later pageshow has no effect", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new ActionRedirectBehavior(bb, HASH_URL);

    behavior.enter();
    behavior.exit();
    firePageShow(true);

    expect(bb.redirectReturnPending).toBe(false);
    expect(bb.pollImmediatelyRequested).toBe(false);
  });

  it("still dispatches will-redirect on enter", () => {
    const events: Event[] = [];
    const bb = buildBlackboard(events);
    const behavior = new ActionRedirectBehavior(bb, HASH_URL);

    behavior.enter();

    expect(events.some((e) => e.type === XenditWillRedirectEvent.type)).toBe(
      true,
    );

    behavior.exit();
  });
});
