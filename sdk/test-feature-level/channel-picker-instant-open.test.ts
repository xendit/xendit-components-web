import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { sleep } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel picker instant open", () => {
  it("should auto-select the only channel when there is exactly one group with one channel", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        // keep only MOCK_QR channel
        channels: channels.filter((ch) => ch.channel_code === "MOCK_QR"),
        channel_ui_groups,
      }),
    });

    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // auto-select happens after one tick
    await sleep(0);

    // the channel should be auto-selected
    expect(sdk.getCurrentChannel()?.channelCode).toEqual("MOCK_QR");

    // the group should be expanded
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).toBeInTheDocument();

    // the channel component should be rendered
    const channelEl = document.querySelector(
      "xendit-payment-channel[data-channel-code=MOCK_QR]",
    );
    expect(channelEl).toBeInTheDocument();
    expect(channelEl).not.toHaveAttribute("inert");
  });

  it("should auto-open the group but not auto-select when there is one group with multiple channels", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        // keep only channels in the "other" group (which has multiple channels)
        channels: channels.filter((ch) => ch.ui_group === "other"),
        channel_ui_groups,
      }),
    });

    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // auto-select happens after one tick
    await sleep(0);

    // no channel should be auto-selected
    expect(sdk.getCurrentChannel()).toBeNull();

    // the group should still be expanded (auto-opened)
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).toBeInTheDocument();

    // the dropdown should be visible showing the group's selection prompt
    expect(screen.getByText("Select Other Mock Channels")).toBeInTheDocument();

    // no channel component should be rendered
    expect(
      document.querySelector("xendit-payment-channel"),
    ).not.toBeInTheDocument();

    // user can still select a channel manually
    await userEvent.click(screen.getByText("Select Other Mock Channels"));
    await userEvent.click(screen.getByText("Mock QR Channel"));

    expect(sdk.getCurrentChannel()?.channelCode).toEqual("MOCK_QR");
  });

  it("should not auto-open when there are multiple groups", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");
    await sleep(1000);

    // no channel should be selected
    expect(sdk.getCurrentChannel()).toBeNull();

    // no group should be expanded
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).not.toBeInTheDocument();
  });

  it("should not auto-open when the only channel is disabled due to min/max amount", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      interceptChannelConfig: ({ channels, channel_ui_groups }) => ({
        // keep only GROUP_DISABLED_1 channel which is disabled due to min/max
        channels: channels.filter(
          (ch) => ch.channel_code === "GROUP_DISABLED_1",
        ),
        channel_ui_groups,
      }),
    });

    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // auto-select happens after one tick
    await sleep(0);

    // no channel should be selected
    expect(sdk.getCurrentChannel()).toBeNull();

    // no group should be expanded since the only channel is disabled
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).not.toBeInTheDocument();
  });
});
