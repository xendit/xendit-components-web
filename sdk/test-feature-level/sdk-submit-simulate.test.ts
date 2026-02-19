import { afterEach, describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit simulate", () => {
  it("should submit and then simulate payment to make the payment succeed", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_QR" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    setTimeout(() => sdk.simulatePayment());
    await waitForEventSequence(sdk, [
      { name: "action-end" },
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);
  });
});
