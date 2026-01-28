import { describe, it, expect } from "vitest";
import { XenditComponents, XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";

describe("sdk destroy component", () => {
  it("should throw if trying to destroy non-xendit component", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    expect(() =>
      sdk.destroyComponent(document.createElement("div")),
    ).toThrowError();
  });

  it("should throw if trying to destroy component twice", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    const picker = sdk.createChannelPickerComponent();
    sdk.destroyComponent(picker);
    expect(() => sdk.destroyComponent(picker)).toThrowError();
  });

  it("should destroy channel picker", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    const picker = sdk.createChannelPickerComponent();
    expect(picker).toBeDefined();

    sdk.destroyComponent(picker);

    // should not return the same element
    const picker2 = sdk.createChannelPickerComponent();
    expect(picker2).not.toBe(picker);
  });

  it("should destroy channel component", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);
    const channel = sdk.createChannelComponent(ch);
    expect(channel).toBeDefined();

    sdk.destroyComponent(channel);

    // should not return the same element
    const channel2 = sdk.createChannelComponent(ch);
    expect(channel2).not.toBe(channel);
  });

  it("should destroy action container component", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    const actionContainer = sdk.createActionContainerComponent();
    expect(actionContainer).toBeDefined();

    sdk.destroyComponent(actionContainer);

    // should not return the same element
    const actionContainer2 = sdk.createActionContainerComponent();
    expect(actionContainer2).not.toBe(actionContainer);
  });
});
