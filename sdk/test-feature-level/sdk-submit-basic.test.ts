import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence, Writable } from "./utils";
import { assert, sleep } from "../src/utils";
import { IframeEvent } from "../../shared/types";

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

  it("should submit and handle an iframe action", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_IFRAME" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for the iframe dialog to show
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    // unsure why this is required
    await sleep(400);

    // fire the mock success event from the iframe
    const iframes = document.querySelectorAll("iframe");
    expect(iframes.length).toBe(1);
    setTimeout(() => {
      fireIframeEvent(iframes[0], {
        type: "xendit-iframe-action-complete",
        mockStatus: "success",
      });
    });

    // wait for session to complete
    await waitForEventSequence(sdk, [
      { name: "action-end" },
      { name: "submission-end", expectedKeys: { reason: "SESSION_COMPLETED" } },
      { name: "session-complete" },
    ]);
  });

  it("should submit and handle an iframe action, which fails", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_IFRAME" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for the iframe dialog to show
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    // unsure why this is required
    await sleep(400);

    // fire the mock fail event from the iframe
    const iframes = document.querySelectorAll("iframe");
    expect(iframes.length).toBe(1);
    setTimeout(() => {
      fireIframeEvent(iframes[0], {
        type: "xendit-iframe-action-complete",
        mockStatus: "fail",
      });
    });

    // wait for the submission to fail and return to the ready state
    await waitForEventSequence(sdk, [
      { name: "action-end" },
      {
        name: "submission-end",
        expectedKeys: { reason: "PAYMENT_REQUEST_FAILED" },
      },
      { name: "submission-ready" },
    ]);
  });
});

function fireIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}
