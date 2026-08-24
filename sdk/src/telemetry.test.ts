import { describe, expect, it } from "vitest";
import { SessionTelemetry, SessionTelemetryEventWithExtras } from "./telemetry";
import { sleep } from "./utils";
import { makeTestSdkKey } from "./data/test-data-modifiers";
import { SessionTelemetryEvent } from "./telemetry-events";
import { MockSdk } from "./utils-test";

describe("telemetry", () => {
  it("should send events", async () => {
    const mockSdk = new MockSdk({ componentsSdkKey: makeTestSdkKey() });
    const telemetry = new SessionTelemetry(mockSdk, false);
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

    // both events should have been sent only after the delay
    expect(firedEvents.length).toBe(0);
    await sleep(3000);
    expect(firedEvents).toEqual([
      expect.objectContaining(e0),
      expect.objectContaining(e1),
      expect.objectContaining(e2),
    ]);
  });

  it("should send events with metadata", async () => {
    const mockSdk = new MockSdk({ componentsSdkKey: makeTestSdkKey() });
    const telemetry = new SessionTelemetry(mockSdk, false);
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
      metadata: { test_metadata: "test" },
    };
    telemetry.append(e0);

    const e1: SessionTelemetryEvent = {
      stage: "CHECKOUT_LOADED",
      success: true,
      metadata: {},
    };
    telemetry.append(e1);

    await sleep(3000);
    expect(firedEvents.map((event) => event.metadata)).toEqual([
      { test_metadata: "test" },
      undefined, // empty object should get converted to null
    ]);
  });

  it("should push and pop scopes", async () => {
    const mockSdk = new MockSdk({ componentsSdkKey: makeTestSdkKey() });
    const telemetry = new SessionTelemetry(mockSdk, false);
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
