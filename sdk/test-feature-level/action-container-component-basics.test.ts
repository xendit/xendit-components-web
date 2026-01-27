import { describe, it, expect } from "vitest";
import { XenditComponents, XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";

describe("action container component basics", () => {
  it("should create action container component", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    const actionContainer = sdk.createActionContainerComponent();
    expect(actionContainer).toBeDefined();
  });

  it("should not cache action container", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    const actionContainer = sdk.createActionContainerComponent();
    const actionContainer2 = sdk.createActionContainerComponent();
    expect(actionContainer).not.toBe(actionContainer2);
  });

  it("should populate action container when action triggered", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    // add container
    const actionContainer = sdk.createActionContainerComponent();
    document.body.appendChild(actionContainer);

    // submit payment
    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_IFRAME" })[0];
    sdk.setCurrentChannel(ch);
    sdk.submit();
    await waitForEvent(sdk, "action-begin");

    // action container should be populated
    expect(actionContainer.querySelector("*")).toBeDefined();
  });

  it("should throw if attempting to create action container during action", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    expect(sdk).toBeInstanceOf(XenditComponents);
    await waitForEvent(sdk, "init");

    // submit payment
    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_IFRAME" })[0];
    sdk.setCurrentChannel(ch);
    sdk.submit();

    // should throw
    await waitForEvent(sdk, "action-begin");
    expect(() => {
      sdk.createActionContainerComponent();
    }).toThrowError();
  });
});
