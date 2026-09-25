import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { sleep } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel picker oneclick", () => {
  it("should automatically start oneclick submission when selecting a QR group with oneClickQr enabled", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        // keep only ONECLICK_QR_TEST channel (a QR channel with no form fields)
        channels: channels.filter(
          (ch) => ch.channel_code === "ONECLICK_QR_TEST",
        ),
        channel_ui_groups,
      }),
    });

    const channelPicker = sdk.createChannelPickerComponent({
      oneClickQr: true,
    });
    document.body.appendChild(channelPicker);
    await waitForEvent(sdk, "init");

    // wait for oneclick flow to start and action to be in progress
    // this needs to be longer than MOCK_NETWORK_DELAY_MS (300ms) for the submission to complete
    await sleep(500);

    // the channel should be auto-selected since it's the only one in the only group
    expect(sdk.getCurrentChannel()?.channelCode).toEqual("ONECLICK_QR_TEST");

    // the group should be expanded
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).toBeInTheDocument();

    // the oneclick group UI should be rendered (not the normal channel picker group)
    expect(
      document.querySelector(".xendit-channel-picker-oneclick-group"),
    ).toBeInTheDocument();

    // the action container should be created inside the oneclick group
    expect(
      channelPicker.querySelector(
        ".xendit-channel-picker-oneclick-action-container",
      ),
    ).toBeInTheDocument();

    // simulate payment to complete the flow
    // setTimeout is needed so waitForEventSequence starts listening before simulatePayment fires
    setTimeout(() => sdk.simulatePayment());
    await waitForEventSequence(sdk, [{ name: "session-complete" }]);
  });

  it("should display QR action inside the channel picker during oneclick flow", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        channels: channels.filter(
          (ch) => ch.channel_code === "ONECLICK_QR_TEST",
        ),
        channel_ui_groups,
      }),
    });

    const channelPicker = sdk.createChannelPickerComponent({
      oneClickQr: true,
    });
    document.body.appendChild(channelPicker);
    await waitForEvent(sdk, "init");

    // wait for the QR action to be rendered in the action container
    // this needs to be longer than MOCK_NETWORK_DELAY_MS (300ms) for the submission to complete
    await sleep(500);

    // the action container inside the channel picker should have the xendit-action-container
    const actionContainer = channelPicker.querySelector(
      ".xendit-channel-picker-oneclick-action-container xendit-action-container",
    );
    expect(actionContainer).toBeInTheDocument();

    // simulate payment to complete and clean up
    setTimeout(() => sdk.simulatePayment());
    await waitForEventSequence(sdk, [{ name: "session-complete" }]);
  });

  it("should not auto-start oneclick when oneClickQr option is false", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        channels: channels.filter(
          (ch) => ch.channel_code === "ONECLICK_QR_TEST",
        ),
        channel_ui_groups,
      }),
    });

    // create channel picker WITHOUT oneClickQr option
    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // wait for instant-open to complete (happens in a setTimeout)
    await sleep(0);

    // the channel should still be auto-selected (instant open behavior)
    expect(sdk.getCurrentChannel()?.channelCode).toEqual("ONECLICK_QR_TEST");

    // but the oneclick UI should NOT be rendered
    expect(
      document.querySelector(".xendit-channel-picker-oneclick-group"),
    ).not.toBeInTheDocument();

    // the normal channel picker group should be rendered instead
    expect(
      document.querySelector(".xendit-channel-picker-group"),
    ).toBeInTheDocument();
  });

  it("should handle oneclick submission with multiple groups where user clicks QR group", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        // keep ONECLICK_QR_TEST and another channel in a different group
        channels: channels.filter(
          (ch) =>
            ch.channel_code === "ONECLICK_QR_TEST" ||
            ch.channel_code === "UI_INPUT_TEST",
        ),
        channel_ui_groups,
      }),
    });

    document.body.appendChild(
      sdk.createChannelPickerComponent({ oneClickQr: true }),
    );
    await waitForEvent(sdk, "init");

    // no channel should be auto-selected since there are multiple groups
    expect(sdk.getCurrentChannel()).toBeNull();

    // no group should be expanded
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).not.toBeInTheDocument();

    // user clicks the One-Click QR group
    await userEvent.click(screen.getByText("Mock One-Click QR Group"));

    // wait for the oneclick flow to start and complete submission
    // this needs to be longer than MOCK_NETWORK_DELAY_MS (300ms)
    await sleep(500);

    // the channel should now be selected
    expect(sdk.getCurrentChannel()?.channelCode).toEqual("ONECLICK_QR_TEST");

    // the oneclick group UI should be rendered
    expect(
      document.querySelector(".xendit-channel-picker-oneclick-group"),
    ).toBeInTheDocument();

    // simulate payment to complete the flow
    setTimeout(() => sdk.simulatePayment());
    await waitForEventSequence(sdk, [{ name: "session-complete" }]);
  });

  it("should allow switching away from oneclick group and abort the submission", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        channels: channels.filter(
          (ch) =>
            ch.channel_code === "ONECLICK_QR_TEST" ||
            ch.channel_code === "UI_INPUT_TEST",
        ),
        channel_ui_groups,
      }),
    });

    document.body.appendChild(
      sdk.createChannelPickerComponent({ oneClickQr: true }),
    );
    await waitForEvent(sdk, "init");

    // click the One-Click QR group to start oneclick flow
    await userEvent.click(screen.getByText("Mock One-Click QR Group"));
    await sleep(100);

    // verify oneclick is active
    expect(sdk.getCurrentChannel()?.channelCode).toEqual("ONECLICK_QR_TEST");
    expect(
      document.querySelector(".xendit-channel-picker-oneclick-group"),
    ).toBeInTheDocument();

    // now click a different group to switch away
    await userEvent.click(screen.getByText("Channel UI Test Cases"));
    await sleep(0);

    // the channel should be cleared or changed
    // the oneclick group should no longer be visible
    expect(
      document.querySelector(
        ".xendit-accordion-item-open .xendit-channel-picker-oneclick-group",
      ),
    ).not.toBeInTheDocument();
  });
});
