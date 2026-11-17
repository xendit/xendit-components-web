import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";
import { internal } from "../src/internal";
import {
  defineMockGooglepay,
  mockGooglepayError,
  setMockGooglepayNextResponse,
} from "./digital-wallet-mock-googlepay";

afterEach(() => {
  document.body.replaceChildren();
  // @ts-expect-error - Clean up mock
  delete window.google;
});

describe("sdk submit gpay probe feature", () => {
  it("should not trigger probe for non-ewallet channels", async () => {
    defineMockGooglepay();
    setMockGooglepayNextResponse({
      paymentData: {
        apiVersion: 2,
        apiVersionMinor: 0,
        paymentMethodData: {
          type: "CARD",
          description: "Visa ***1234",
          tokenizationData: {
            type: "PAYMENT_GATEWAY",
            token: "mock-token",
          },
        },
      },
    });

    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      enableDigitalWalletProbe: {
        digitalWallet: "GOOGLE_PAY",
        channels: null,
      },
    });

    await waitForEvent(sdk, "init");

    // Use a non-ewallet channel (virtual account)
    const ch = sdk.getActiveChannels({ filter: "MOCK_VA" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // Submit - should go straight to normal submission (no probe for VA)
    setTimeout(() => sdk.submit());

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" }, // normal submission creates a payment request
      { name: "action-begin" }, // VA has an action
    ]);
  });

  it("should trigger gpay probe and use fake submission when successful", async () => {
    defineMockGooglepay();
    setMockGooglepayNextResponse({
      paymentData: {
        apiVersion: 2,
        apiVersionMinor: 0,
        paymentMethodData: {
          // @ts-expect-error - Unreleased gpay ewallet type
          type: "EWALLET",
        },
      },
    });

    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      enableDigitalWalletProbe: {
        digitalWallet: "GOOGLE_PAY",
        channels: null,
      },
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_GOOGLE_PAY_EWALLET" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // Verify probe is available before submission
    expect(sdk[internal].behaviorTree.bb.digitalWalletProbeAvailable).toBe(
      true,
    );

    // Submit - should trigger the gpay probe and then use fake submission flow
    setTimeout(() => sdk.submit());

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      // No payment-request-created - fake submission doesn't create one
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);

    // Verify state is properly reset
    expect(sdk[internal].behaviorTree.bb.submissionRequested).toBe(false);
    expect(sdk[internal].behaviorTree.bb.useFakeSubmissionFlow).toBe(false);
  });

  it("should fall back to normal submission when gpay probe fails", async () => {
    defineMockGooglepay();
    setMockGooglepayNextResponse({
      error: mockGooglepayError("User cancelled", "CANCELED"),
    });

    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      enableDigitalWalletProbe: {
        digitalWallet: "GOOGLE_PAY",
        channels: null,
      },
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_GOOGLE_PAY_EWALLET" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // Submit - gpay probe will fail, should fall back to normal submission
    setTimeout(() => sdk.submit());

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" }, // normal submission creates a payment request
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);
  });
});
