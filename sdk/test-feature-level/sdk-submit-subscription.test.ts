import { afterEach, describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
});

async function initSubscriptionSdk(
  requirePaymentToActivate?: boolean,
): Promise<XenditComponentsTest> {
  const sdk = new XenditComponentsTest({
    componentsSdkKey: "test-client-key",
  });

  await waitForEvent(sdk, "init");

  sdk[internal].worldState!.session.session_type = "SUBSCRIPTION";
  sdk[internal].worldState!.session.subscription = {
    require_payment_to_activate: requirePaymentToActivate,
    schedule: {
      interval: "MONTH",
      interval_count: 1,
    },
  };

  return sdk;
}

describe("sdk submit subscription", () => {
  it("should submit and create a payment token when require_payment_to_activate is false", async () => {
    const sdk = await initSubscriptionSdk(false);

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-token-created" },
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);
  });

  it("should submit and create a payment request when require_payment_to_activate is true", async () => {
    const sdk = await initSubscriptionSdk(true);

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);
  });
});
