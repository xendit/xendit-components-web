import { afterEach, describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit basics", () => {
  it("should submit and succeed with no action required", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);
  });

  it("should submit and abort the submission", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and abort immediately
    setTimeout(() => {
      sdk.submit();
      sdk.abortSubmission();
    });

    // wait for submission to fail and return to the ready state
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "submission-end", expectedKeys: { reason: "REQUEST_ABORTED" } },
      { name: "submission-ready" },
    ]);
  });
});
