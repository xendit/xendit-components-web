import { describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForTelemetryEvent } from "./utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

describe("channel picker telemetry", () => {
  it("should fire CHECKOUT_CHANNEL_GROUP when a group is clicked", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // click group to fire event
    const testCasesGroup1 = screen.getByText("Channel UI Test Cases");
    await userEvent.click(testCasesGroup1);
    const e1 = await waitForTelemetryEvent(sdk, "CHECKOUT_CHANNEL_GROUP", true);
    expect(e1.metadata?.group_name).toBe("Channel UI Test Cases");
    // Should include channels from ui_tests group
    expect(e1.metadata?.channels).toEqual(
      expect.arrayContaining([
        "UI_INPUT_TEST",
        "UI_INITIAL_VALUE_TEST",
        "UI_FIELD_GROUPING_TEST",
      ]),
    );

    // again, ensure previous event was popped
    const testCasesGroup2 = screen.getByText("Other Mock Channels");
    await userEvent.click(testCasesGroup2);
    const e2 = await waitForTelemetryEvent(sdk, "CHECKOUT_CHANNEL_GROUP", true);
    expect(e2.metadata?.group_name).toBe("Other Mock Channels");
    // Should include channels from other group
    expect(e2.metadata?.channels).toEqual(
      expect.arrayContaining([
        "MOCK_EWALLET",
        "MOCK_QR",
        "MOCK_VA",
        "MOCK_OTC",
      ]),
    );

    // they should be siblings
    expect(e1.parent_event_id).toBe(e2.parent_event_id);
  });
});
