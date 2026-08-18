import { describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForTelemetryEvent } from "./utils";
import { assert } from "../src/utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

describe("channel component telemetry", () => {
  it("should fire CHECKOUT_CHANNEL when a channel is selected", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const channel1 = sdk
      .getActiveChannels()
      .find((ch) => ch.channelCode === "MOCK_QR");
    assert(channel1);
    sdk.createChannelComponent(channel1);

    // should fire event as soon as its created
    const e1 = await waitForTelemetryEvent(sdk, "CHECKOUT_CHANNEL", true);
    expect(e1.payment_channel).toBe("MOCK_QR");

    // switching channel should fire another event
    const channel2 = sdk
      .getActiveChannels()
      .find((ch) => ch.channelCode === "MOCK_EWALLET");
    assert(channel2);
    sdk.createChannelComponent(channel2);

    const e2 = await waitForTelemetryEvent(sdk, "CHECKOUT_CHANNEL", true);
    expect(e2.payment_channel).toBe("MOCK_EWALLET");
    // it should have the same parent
    expect(e1.parent_event_id).toBe(e2.parent_event_id);
  });

  it("should fire CHECKOUT_CHANNEL_FORM_INPUT when an input is modified for the first time", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const channel1 = sdk
      .getActiveChannels()
      .find((ch) => ch.channelCode === "UI_INPUT_TEST");
    assert(channel1);
    document.body.appendChild(sdk.createChannelComponent(channel1));

    // should fire event as soon as its created
    const e1 = await waitForTelemetryEvent(sdk, "CHECKOUT_CHANNEL", true);
    expect(e1.payment_channel).toBe("UI_INPUT_TEST");

    // paste into text field
    const textInput = screen.getByLabelText("Text");
    await userEvent.click(textInput);
    await userEvent.paste("text");

    // it should fire the form input event
    const e2 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_CHANNEL_FORM_INPUT",
      true,
    );
    expect(e2.payment_channel).toBe("UI_INPUT_TEST");
    expect(e2.metadata?.field_name).toBe("channel_properties.text_field");

    // again with a different field
    const dropdown = screen.getByLabelText("Dropdown");
    await userEvent.click(dropdown);
    await userEvent.click(screen.getByText("Option 3"));

    // it should fire the form input event
    const e3 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_CHANNEL_FORM_INPUT",
      true,
    );
    expect(e3.payment_channel).toBe("UI_INPUT_TEST");
    expect(e3.metadata?.field_name).toBe("channel_properties.dropdown_field");

    // they should both be children of the CHECKOUT_CHANNEL event
    expect(e2.parent_event_id).toBe(e1.event_id);
    expect(e3.parent_event_id).toBe(e1.event_id);
  });
});
