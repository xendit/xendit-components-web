import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";
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

describe("current channel changed", () => {
  it("fires with the channel code when set by api", async () => {
    const sdk = await initSdk();
    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);

    const onChanged = vi.fn();
    sdk.addEventListener("current-channel-changed", onChanged);

    sdk.setCurrentChannel(ch);

    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onChanged.mock.calls[0][0].channelCode).toBe("MOCK_QR");
  });

  it("fires with null when the channel is cleared", async () => {
    const sdk = await initSdk();
    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);
    sdk.setCurrentChannel(ch);

    const onChanged = vi.fn();
    sdk.addEventListener("current-channel-changed", onChanged);

    sdk.setCurrentChannel(null);

    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onChanged.mock.calls[0][0].channelCode).toBeNull();
  });

  it("does not fire when the same channel is set again", async () => {
    const sdk = await initSdk();
    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);
    sdk.setCurrentChannel(ch);

    const onChanged = vi.fn();
    sdk.addEventListener("current-channel-changed", onChanged);

    sdk.setCurrentChannel(ch);

    expect(onChanged).not.toHaveBeenCalled();
  });

  it("fires when createChannelComponent is called directly", async () => {
    const sdk = await initSdk();
    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);

    const onChanged = vi.fn();
    sdk.addEventListener("current-channel-changed", onChanged);

    sdk.createChannelComponent(ch);

    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onChanged.mock.calls[0][0].channelCode).toBe("MOCK_QR");
  });

  it("fires only when a channel is picked, not when a group is opened", async () => {
    const sdk = await initSdk();
    document.body.appendChild(sdk.createChannelPickerComponent());

    const onChanged = vi.fn();
    sdk.addEventListener("current-channel-changed", onChanged);

    // opening a group with multiple channels only previews it
    await userEvent.click(screen.getByText("Channel UI Test Cases"));
    expect(onChanged).not.toHaveBeenCalled();

    await userEvent.click(screen.getByText("Select Channel UI Test Cases"));
    await userEvent.click(screen.getByText("Input Test"));
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onChanged.mock.calls[0][0].channelCode).toBe("UI_INPUT_TEST");
  });

  it("fires before other events for the new channel", async () => {
    const sdk = await initSdk();
    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);

    const order: string[] = [];
    sdk.addEventListener("current-channel-changed", (event) =>
      order.push(event.type),
    );
    sdk.addEventListener("channel-properties-changed", (event) =>
      order.push(event.type),
    );
    sdk.addEventListener("submission-ready", (event) => order.push(event.type));

    sdk.createChannelComponent(ch);

    expect(order).toEqual([
      "current-channel-changed",
      "channel-properties-changed",
      "submission-ready",
    ]);
  });
});
