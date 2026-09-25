import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel picker basics", () => {
  it("should be able to create a channel picker before initializing", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    sdk.createChannelPickerComponent();
  });

  it("should render channel picker component after initializing", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    const el = document.body.querySelector("xendit-channel-picker");
    expect(el).toBeEmptyDOMElement();

    await waitForEvent(sdk, "init");

    expect(el).not.toBeEmptyDOMElement();
  });

  it("should display channel group list", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const expected = [
      "Mock Cards",
      "Other Mock Channels",
      "Channel UI Test Cases",
    ];
    for (const groupName of expected) {
      expect(screen.getByText(groupName)).toBeInTheDocument();
    }
  });

  it("should expand to show channel selection dropdown", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const testCasesGroup = screen.getByText("Channel UI Test Cases");
    await userEvent.click(testCasesGroup);

    const dropdown = screen.getByText("Select Channel UI Test Cases");
    expect(dropdown).toBeInTheDocument();
  });

  it("should select channel using dropdown", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const testCasesGroup = screen.getByText("Channel UI Test Cases");
    await userEvent.click(testCasesGroup);

    const dropdown = screen.getByText("Select Channel UI Test Cases");
    await userEvent.click(dropdown);

    // no channel selected yet
    const nothing = document.body.querySelector("xendit-payment-channel");
    expect(nothing).not.toBeInTheDocument();
    expect(sdk.getCurrentChannel()).toBeNull();

    const option = screen.getByText("Input Test");
    await userEvent.click(option);

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    const channelComponent = sdk.createChannelComponent(ch);
    expect(channelComponent).toBeInTheDocument();

    expect(sdk.getCurrentChannel()?.channelCode).toEqual(ch.channelCode);
  });

  it("should show disabled reason for fully disabled group but not for partially disabled group", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // Mock Disabled Group: all channels disabled, should show disabled reason
    const disabledGroupHeader = screen.getByText("Mock Disabled Group");
    const disabledGroupItem = disabledGroupHeader.closest(
      ".xendit-accordion-item",
    );
    assert(disabledGroupItem);
    const disabledGroupSubtitle = within(
      disabledGroupItem as HTMLElement,
    ).queryByText("The payment amount is below the min. transaction limit");
    expect(disabledGroupSubtitle).toBeInTheDocument();

    // Mock Partial Disabled Group: some channels enabled, should NOT show disabled reason
    const partialGroupHeader = screen.getByText("Mock Partial Disabled Group");
    const partialGroupItem = partialGroupHeader.closest(
      ".xendit-accordion-item",
    );
    assert(partialGroupItem);
    const partialGroupSubtitle = within(
      partialGroupItem as HTMLElement,
    ).queryByText("The payment amount is below the min. transaction limit");
    expect(partialGroupSubtitle).not.toBeInTheDocument();
  });
});
