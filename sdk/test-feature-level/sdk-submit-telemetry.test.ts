import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForTelemetryEvent } from "./utils";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit telemetry", () => {
  it("should send CHECKOUT_ATTEMPT_BEGIN when starting a submission and CHECKOUT_ATTEMPT when the server returns", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit
    setTimeout(() => sdk.submit());

    // it should fire these two events
    const e1 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT_BEGIN", true);
    const e2 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT", true);

    // the second should be a child of the first
    expect(e2.parent_event_id).toBe(e1.event_id);
  });
});

describe("sdk submit telemetry - discard", () => {
  it("should send CHECKOUT_ATTEMPT_DISCARD after a payment failure", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit
    setTimeout(() => sdk.submit());

    // it should fire these two events
    const e1 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT_BEGIN", true);
    const e2 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT", true);

    sdk.abortSubmission();

    const e3 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_ATTEMPT_DISCARD",
      false,
    );

    // the discard event is a child of the attempt event
    expect(e2.parent_event_id).toBe(e1.event_id);
    expect(e3.parent_event_id).toBe(e2.event_id);

    // again - check that the scope was popped correctly, both attempt_begin events should be siblings
    setTimeout(() => sdk.submit());
    const e4 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT_BEGIN", true);
    expect(e4.parent_event_id).toBe(e1.parent_event_id);
  });
});

describe("sdk submit telemetry - actions and end states", () => {
  it("should send CHECKOUT_ATTEMPT_DISCARD after a payment failure", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit
    setTimeout(() => sdk.submit());

    // it should fire these two events
    const e1 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT_BEGIN", true);
    const e2 = await waitForTelemetryEvent(sdk, "CHECKOUT_ATTEMPT", true);
    const e3 = await waitForTelemetryEvent(sdk, "CHECKOUT_ACTION_BEGIN", true);

    sdk.simulatePayment();

    const e4 = await waitForTelemetryEvent(sdk, "CHECKOUT_ACTION_CLOSE", true);
    const e5 = await waitForTelemetryEvent(sdk, "CHECKOUT_END", true);

    // the first 4 events should be children of the previous
    expect(e2.parent_event_id).toBe(e1.event_id);
    expect(e3.parent_event_id).toBe(e2.event_id);
    expect(e4.parent_event_id).toBe(e3.event_id);

    // the 5th event should be a sibling of the first
    expect(e5.parent_event_id).toBe(e1.parent_event_id);
  });
});
