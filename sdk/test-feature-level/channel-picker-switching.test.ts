import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel picker switching", () => {
  it("should switch channels using dropdown", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    await userEvent.click(screen.getByText("Channel UI Test Cases"));

    // select a channel
    await userEvent.click(screen.getByText("Select Channel UI Test Cases"));
    await userEvent.click(screen.getByText("Input Test"));
    const testEl = document.querySelector(
      "xendit-payment-channel[data-channel-code=UI_INPUT_TEST]",
    );

    // select another channel using the dropdown
    await userEvent.click(screen.getByText("Input Test"));
    await userEvent.click(screen.getByText("Field Grouping Test"));

    expect(sdk.getCurrentChannel()?.channelCode).toEqual(
      "UI_FIELD_GROUPING_TEST",
    );

    // new channel component should be rendered and not inert
    const testEl2 = document.querySelector(
      "xendit-payment-channel[data-channel-code=UI_FIELD_GROUPING_TEST]",
    );
    expect(testEl2).toBeInTheDocument();
    expect(testEl2).not.toHaveAttribute("inert");

    // unselected channel component should be removed and should have inert attribute
    expect(testEl).not.toBeInTheDocument();
    expect(testEl).toHaveAttribute("inert");
  });

  it("should clear selected channel by switching to another group", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // select a channel
    await userEvent.click(screen.getByText("Channel UI Test Cases"));
    await userEvent.click(screen.getByText("Select Channel UI Test Cases"));
    await userEvent.click(screen.getByText("Input Test"));
    expect(sdk.getCurrentChannel()?.channelCode).toEqual("UI_INPUT_TEST");

    // collapse group to clear channel
    const otherGroup = screen.getByText("Other Mock Channels");
    await userEvent.click(otherGroup);
    expect(sdk.getCurrentChannel()).toBeNull();
  });

  it("should switch channels across two groups", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // first, select a channel and collapse its group
    await userEvent.click(screen.getByText("Other Mock Channels"));
    await userEvent.click(screen.getByText("Select Other Mock Channels"));
    await userEvent.click(screen.getByText("Mock QR Channel"));
    const testEl1 = document.querySelector(
      "xendit-payment-channel[data-channel-code=MOCK_QR]",
    );
    await userEvent.click(screen.getByText("Other Mock Channels"));
    expect(sdk.getCurrentChannel()).toBeNull();

    // select a channel in another group
    await userEvent.click(screen.getByText("Channel UI Test Cases"));
    await userEvent.click(screen.getByText("Select Channel UI Test Cases"));
    await userEvent.click(screen.getByText("Input Test"));
    expect(sdk.getCurrentChannel()?.channelCode).toBe("UI_INPUT_TEST");
    const testEl2 = document.querySelector(
      "xendit-payment-channel[data-channel-code=UI_INPUT_TEST]",
    );

    // switch back to first group and the QR channel should be automatically selected
    await userEvent.click(screen.getByText("Other Mock Channels"));
    expect(sdk.getCurrentChannel()?.channelCode).toBe("MOCK_QR");
    const testEl3 = document.querySelector(
      "xendit-payment-channel[data-channel-code=MOCK_QR]",
    );

    // the same channel component should be back
    expect(testEl1).toBe(testEl3);

    // the new component should be rendered and not inert
    expect(testEl1).toBeInTheDocument();
    expect(testEl1).not.toHaveAttribute("inert");

    // the unselected channel component should be in the document (under the other group) and inert
    expect(testEl2).toBeInTheDocument();
    expect(testEl2).toHaveAttribute("inert");
  });

  it("should autoselect a channel if opening a group with one channel", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // selecting a group with one channel should autoselect the channel
    await userEvent.click(screen.getByText("Mock Single Item Group"));
    expect(sdk.getCurrentChannel()?.channelCode).toEqual(
      "GROUP_SINGLE_ITEM_TEST",
    );

    // same if the group has multiple channels but only one is enabled
    await userEvent.click(screen.getByText("Mock Partial Disabled Group"));
    expect(sdk.getCurrentChannel()?.channelCode).toEqual(
      "GROUP_PARTIAL_DISABLED_1",
    );
  });

  it("should open channel picker when user selects a channel by api", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // select a channel by api
    sdk.setCurrentChannel(
      sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0],
    );

    // dropdown should be visible (showing the selected channel name)
    expect(screen.getByText("Input Test")).toBeInTheDocument();

    // channel component should be visible and not inert
    const testEl = document.querySelector(
      "xendit-payment-channel[data-channel-code=UI_INPUT_TEST]",
    );
    expect(testEl).toBeInTheDocument();
    expect(testEl).not.toHaveAttribute("inert");
  });

  it("should collapse group if a channel is selected and the channel is cleared by api", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    document.body.appendChild(sdk.createChannelPickerComponent());
    await waitForEvent(sdk, "init");

    // first, select a channel
    await userEvent.click(screen.getByText("Other Mock Channels"));
    await userEvent.click(screen.getByText("Select Other Mock Channels"));
    await userEvent.click(screen.getByText("Mock QR Channel"));
    const testEl1 = document.querySelector(
      "xendit-payment-channel[data-channel-code=MOCK_QR]",
    );

    // clear channel by api
    sdk.setCurrentChannel(null);

    // group should be collapsed
    expect(
      document.querySelector(".xendit-accordion-item-open"),
    ).not.toBeInTheDocument();

    // channel component should still be in the document but should be inert
    expect(testEl1).toBeInTheDocument();
    expect(testEl1).toHaveAttribute("inert");
  });
});
