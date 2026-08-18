import { XenditComponents } from "./public-sdk";
import { describe, expect, it } from "vitest";
import { SessionTelemetry, SessionTelemetryEventWithExtras } from "./telemetry";
import { parseSdkKey, sleep } from "./utils";
import { makeTestSdkKey } from "./data/test-data-modifiers";
import { internal } from "./internal";
import { makeTestBffData } from "./data/test-data";
import { SessionTelemetryEvent } from "./telemetry-events";

const testData = makeTestBffData();
const mockSdk = {
  [internal]: {
    sdkKey: parseSdkKey(makeTestSdkKey()),
    worldState: {
      session: testData.session,
    },
  },
} as unknown as XenditComponents;

describe("telemetry", () => {
  it("should send events", async () => {
    const telemetry = new SessionTelemetry(mockSdk);
    const firedEvents: SessionTelemetryEventWithExtras[] = [];
    telemetry.addEventListener("events-flushed", (event) => {
      while (true) {
        const next = telemetry.testGetNextEvent();
        if (next) firedEvents.push(next);
        else break;
      }
    });

    const e0: SessionTelemetryEvent = {
      stage: "CHECKOUT_LOADED",
      success: true,
    };
    telemetry.append(e0);

    const e1: SessionTelemetryEvent = {
      stage: "CHECKOUT_ATTEMPT",
      success: true,
    };
    telemetry.append(e1);

    const e2: SessionTelemetryEvent = {
      stage: "CHECKOUT_ATTEMPT",
      success: true,
    };
    telemetry.append(e2);

    // both events should have been sent
    expect(firedEvents.length).toBe(0);
    await sleep(3000);
    expect(firedEvents).toEqual([
      expect.objectContaining(e0),
      expect.objectContaining(e1),
      expect.objectContaining(e2),
    ]);
  });

  it("should push and pop scopes", async () => {
    const telemetry = new SessionTelemetry(mockSdk);
    const firedEvents: SessionTelemetryEventWithExtras[] = [];
    telemetry.addEventListener("events-flushed", (event) => {
      while (true) {
        const next = telemetry.testGetNextEvent();
        if (next) firedEvents.push(next);
        else break;
      }
    });

    const e0: SessionTelemetryEvent = {
      stage: "CHECKOUT_LOADED",
      success: true,
    };
    telemetry.appendAndPushScope(e0);

    const e1: SessionTelemetryEvent = {
      stage: "CHECKOUT_ATTEMPT_BEGIN",
      success: true,
    };
    const scope = telemetry.appendAndPushScope(e1);

    const e2: SessionTelemetryEvent = {
      stage: "CHECKOUT_ATTEMPT",
      success: true,
    };
    telemetry.appendAndPushScope(e2);

    const e3: SessionTelemetryEvent = {
      stage: "CHECKOUT_ACTION_BEGIN",
      success: true,
    };
    telemetry.appendAndPushScope(e3);

    telemetry.popScope(scope);

    const e4: SessionTelemetryEvent = {
      stage: "CHECKOUT_ABANDON",
      success: true,
    };
    telemetry.append(e4);

    // all 5 events should have been pushed
    expect(firedEvents.length).toBe(0);
    await sleep(3000);

    expect(firedEvents).toEqual([
      expect.objectContaining(e0),
      expect.objectContaining(e1),
      expect.objectContaining(e2),
      expect.objectContaining(e3),
      expect.objectContaining(e4),
    ]);

    // the first event should a root event
    expect(firedEvents[0].parent_event_id).toBe(undefined);
    // these events should be children of eachother
    expect(firedEvents[1].parent_event_id).toBe(firedEvents[0].event_id);
    expect(firedEvents[2].parent_event_id).toBe(firedEvents[1].event_id);
    expect(firedEvents[3].parent_event_id).toBe(firedEvents[2].event_id);
    // the scope was popped so this should be a child of the first event
    expect(firedEvents[4].parent_event_id).toBe(firedEvents[0].event_id);
  });
});
