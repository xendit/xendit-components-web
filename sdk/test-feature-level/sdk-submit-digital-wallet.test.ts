import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit digital wallet", () => {
  it("should submit digital wallet and succeed with no action required", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0]; // test with a channel with no action
    assert(ch);

    // start submission and wait for completion
    setTimeout(() => {
      sdk.submitDigitalWallet("GOOGLE_PAY", ch, {
        google_pay: "...",
      });
    });
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);

    // it should no longer be submitting
    expect(sdk[internal].behaviorTree.bb.submissionRequested).toBe(false);
    expect(sdk[internal].currentDigitalWalletSubmission).toBeNull();
  });

  it("should submit digital wallet and insta-fail", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET" })[0]; // test with a channel with no action
    assert(ch);

    // start submission wait for completion
    setTimeout(() => {
      sdk.submitDigitalWallet(
        "GOOGLE_PAY",
        ch,
        {},
        {
          text: ["Payment failed"],
          code: "GOOGLE_PAY_ERROR",
        },
      );
    });
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      {
        name: "submission-end",
        expectedKeys: {
          reason: "REQUEST_FAILED",
          developerErrorMessage: {
            type: "ERROR",
            code: "GOOGLE_PAY_ERROR",
          },
        },
      },
    ]);

    // it should no longer be submitting
    expect(sdk[internal].behaviorTree.bb.submissionRequested).toBe(false);
    expect(sdk[internal].currentDigitalWalletSubmission).toBeNull();
  });
});
