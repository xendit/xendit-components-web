import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("initialization", () => {
  it("should be able to create a channel picker before initializing", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    sdk.createChannelPickerComponent();
  });

  it("should render channel picker component after initializing", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    const el = document.body.querySelector("xendit-channel-picker");
    expect(el).toBeEmptyDOMElement();

    await waitForEvent(sdk, "init");

    expect(el).not.toBeEmptyDOMElement();
  });

  it("should display channel group list", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const expected = [
      "Bank Transfer",
      "Cards",
      "E-Wallet",
      "Online Banking",
      "Over The Counter",
      "QR Code",
    ];
    for (const groupName of expected) {
      expect(screen.getByText(groupName)).toBeInTheDocument();
    }
  });

  it("should expand to show channel selection dropdown", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const bankTransferGroup = screen.getByText("Bank Transfer");
    await userEvent.click(bankTransferGroup);

    const dropdown = screen.getByText("Select Bank Transfer");
    expect(dropdown).toBeInTheDocument();
  });

  it("should select channel using dropdown", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const bankTransferGroup = screen.getByText("Bank Transfer");
    await userEvent.click(bankTransferGroup);

    const dropdown = screen.getByText("Select Bank Transfer");
    await userEvent.click(dropdown);

    const nothing = document.body.querySelector("xendit-payment-channel");
    expect(nothing).not.toBeInTheDocument();
    expect(sdk.getCurrentChannel()).toBeNull();

    const bcaOption = screen.getByText("Mandiri Virtual Account");
    await userEvent.click(bcaOption);

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "MANDIRI_VIRTUAL_ACCOUNT");
    assert(ch);
    const channelComponent = sdk.createChannelComponent(ch);
    expect(channelComponent).toBeInTheDocument();

    expect(sdk.getCurrentChannel()?.channelCode).toEqual(ch.channelCode);
  });

  it("should clear channel by switching groups", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    const bankTransferGroup = screen.getByText("Bank Transfer");
    await userEvent.click(bankTransferGroup);

    const dropdown = screen.getByText("Select Bank Transfer");
    await userEvent.click(dropdown);

    const bcaOption = screen.getByText("Mandiri Virtual Account");
    await userEvent.click(bcaOption);

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "MANDIRI_VIRTUAL_ACCOUNT");
    assert(ch);
    expect(sdk.getCurrentChannel()?.channelCode).toEqual(ch.channelCode);

    const ewalletGroup = screen.getByText("E-Wallet");
    await userEvent.click(ewalletGroup);

    expect(sdk.getCurrentChannel()).toBeNull();
  });
});
