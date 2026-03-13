import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit with paylink action", () => {
  it("should submit and create a paylink action", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      enablePaylinks: true,
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_PAYLINK" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    const paylink = document.head.querySelector(
      'link[rel="facilitated-payment"]',
    ) as HTMLLinkElement | null;
    assert(paylink);
    expect(paylink).toBeInTheDocument();
    expect(paylink?.href).toBe("https://example.com/paylink");
  });
});
