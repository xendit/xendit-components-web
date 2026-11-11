import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, watchEvents } from "./utils";
import { assert } from "../src/utils";
import { internal } from "../src/internal";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  document.body.replaceChildren();
});

async function initSdk() {
  const sdk = new XenditComponentsTest({
    componentsSdkKey: "test-client-key",
  });
  await waitForEvent(sdk, "init");
  return sdk;
}

function findChannel(sdk: XenditComponentsTest, channelCode: string) {
  const ch = sdk.getActiveChannels({ filter: channelCode })[0];
  assert(ch);
  return ch;
}

function listen(sdk: XenditComponentsTest) {
  const onWillSave = vi.fn();
  sdk.addEventListener("will-save-payment-method", onWillSave);
  return {
    onWillSave,
    values: () => onWillSave.mock.calls.map((c) => c[0].willSavePaymentMethod),
  };
}

function getSaveCheckbox() {
  return screen.getByLabelText("Save this payment method for future payments");
}

describe("will save payment method", () => {
  it("does not fire on init", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    const { onWillSave } = listen(sdk);
    await waitForEvent(sdk, "init");

    expect(onWillSave).not.toHaveBeenCalled();
  });

  it("fires true when the save checkbox is checked", async () => {
    const sdk = await initSdk();
    document.body.appendChild(
      sdk.createChannelComponent(
        findChannel(sdk, "UI_SAVE_PAYMENT_DETAILS_TEST"),
      ),
    );

    const { values } = listen(sdk);
    await userEvent.click(getSaveCheckbox());

    expect(values()).toEqual([true]);
  });

  it("fires false when the save checkbox is unchecked", async () => {
    const sdk = await initSdk();
    document.body.appendChild(
      sdk.createChannelComponent(
        findChannel(sdk, "UI_SAVE_PAYMENT_DETAILS_TEST"),
      ),
    );
    await userEvent.click(getSaveCheckbox());

    const { values } = listen(sdk);
    await userEvent.click(getSaveCheckbox());

    expect(values()).toEqual([false]);
  });

  it("fires true when a forced-save channel becomes current", async () => {
    const sdk = await initSdk();

    const { values } = listen(sdk);
    sdk.createChannelComponent(findChannel(sdk, "UI_FORCED_SAVE_TEST"));

    expect(values()).toEqual([true]);
  });

  it("does not fire when the current channel is cleared", async () => {
    const sdk = await initSdk();
    sdk.createChannelComponent(findChannel(sdk, "UI_FORCED_SAVE_TEST"));

    const { onWillSave } = listen(sdk);
    sdk.setCurrentChannel(null);

    expect(onWillSave).not.toHaveBeenCalled();
  });

  it("clears the memorized value when the channel changes", async () => {
    const sdk = await initSdk();
    // Start with a forced-save channel (will-save = true)
    sdk.createChannelComponent(findChannel(sdk, "UI_FORCED_SAVE_TEST"));

    // Clear the channel (memorized value should be reset)
    sdk.setCurrentChannel(null);

    // Set a new channel that doesn't force save (will-save = false)
    // Since the memorized value was cleared, this should fire false
    const { values } = listen(sdk);
    sdk.setCurrentChannel(findChannel(sdk, "MOCK_QR"));

    expect(values()).toEqual([false]);
  });

  it("fires when switching between channels with the same value", async () => {
    const sdk = await initSdk();
    sdk.setCurrentChannel(findChannel(sdk, "MOCK_QR"));

    const { values } = listen(sdk);
    sdk.setCurrentChannel(findChannel(sdk, "UI_INPUT_TEST"));

    // Since the memorized value is cleared on channel change, the event fires
    // even when switching to a channel with the same will-save value
    expect(values()).toEqual([false]);
  });

  it("fires true in a SAVE session when a channel becomes current", async () => {
    const sdk = await initSdk();
    sdk[internal].worldState!.session.session_type = "SAVE";

    const { values } = listen(sdk);
    sdk.setCurrentChannel(findChannel(sdk, "MOCK_QR"));

    expect(values()).toEqual([true]);
  });

  it("fires once, after current-channel-changed and before submission-ready", async () => {
    const sdk = await initSdk();

    const events = watchEvents(sdk, [
      "current-channel-changed",
      "will-save-payment-method",
      "submission-ready",
    ]);
    // no component exists yet, so setCurrentChannel creates it internally
    sdk.setCurrentChannel(findChannel(sdk, "UI_FORCED_SAVE_TEST"));

    expect(events.map((e) => e.name)).toEqual([
      "current-channel-changed",
      "will-save-payment-method",
      "submission-ready",
    ]);
  });

  it("follows the checkbox on a paired channel", async () => {
    const sdk = await initSdk();
    document.body.appendChild(
      sdk.createChannelComponent(findChannel(sdk, "UI_PAIRED_CHANNELS_TEST_1")),
    );

    const { values } = listen(sdk);
    await userEvent.click(getSaveCheckbox());
    await userEvent.click(getSaveCheckbox());

    expect(values()).toEqual([true, false]);
  });

  it("fires for each channel when a listener changes the channel", async () => {
    const sdk = await initSdk();
    const forcedSave = findChannel(sdk, "UI_FORCED_SAVE_TEST");
    sdk.addEventListener("current-channel-changed", (event) => {
      if (event.channelCode === "MOCK_QR") {
        sdk.setCurrentChannel(forcedSave);
      }
    });

    const { values } = listen(sdk);
    expect(() =>
      sdk.setCurrentChannel(findChannel(sdk, "MOCK_QR")),
    ).not.toThrow();

    // The listener changes the channel during the current-channel-changed event.
    // Due to the nested channel change, the will-save event fires twice for the
    // forced-save channel (once from the nested update, once from the original).
    expect(values()).toEqual([true, true]);
    expect(sdk.getCurrentChannel()?.channelCode).toBe("UI_FORCED_SAVE_TEST");
  });
});
