import { describe, expect, it, vi } from "vitest";
import { SessionFailedBehavior } from "./session-failed";
import { BlackboardType } from "../behavior-tree";
import { BffSessionStatus } from "../../backend-types/session";
import { XenditSessionExpiredOrCanceledEvent } from "../../public-event-types";
import { makeTestBffData } from "../../data/test-data";

const testData = makeTestBffData();

function buildBlackboard(
  status: BffSessionStatus,
  events: Event[],
  appendTelemetry: (event: unknown) => void,
): BlackboardType {
  return {
    world: { session: { ...testData.session, status } },
    telemetry: { append: appendTelemetry },
    dispatchEvent: (event: Event) => {
      events.push(event);
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("SessionFailedBehavior", () => {
  it("reports a session whose TTL ran out as EXPIRED without changing it", () => {
    const events: Event[] = [];
    const appendTelemetry = vi.fn();
    // the server still says ACTIVE, the behavior tree passed EXPIRED as the node key
    const bb = buildBlackboard("ACTIVE", events, appendTelemetry);

    new SessionFailedBehavior(bb, "EXPIRED").enter();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(XenditSessionExpiredOrCanceledEvent);
    expect(appendTelemetry.mock.calls[0][0].metadata.status).toBe("EXPIRED");
    expect(bb.world!.session.status).toBe("ACTIVE");
  });

  it.each(["EXPIRED", "CANCELED"] as const)(
    "reports a %s session from the server",
    (status) => {
      const events: Event[] = [];
      const appendTelemetry = vi.fn();
      const bb = buildBlackboard(status, events, appendTelemetry);

      new SessionFailedBehavior(bb, status).enter();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(XenditSessionExpiredOrCanceledEvent);
      expect(appendTelemetry.mock.calls[0][0].metadata.status).toBe(status);
    },
  );
});
