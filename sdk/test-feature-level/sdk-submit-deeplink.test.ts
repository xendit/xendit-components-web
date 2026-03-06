import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit with deeplink action", () => {
  it("should submit and succeed with deeplink action", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_DEEP_LINK" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    const button = screen.getByRole("link", { name: "Open App" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("href", "mockapp://mock-deep-link");
  });

  it("should submit and then abort when the action modal is closed", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_DEEP_LINK" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeInTheDocument();

    setTimeout(() => userEvent.click(button));
    await waitForEventSequence(sdk, [
      { name: "action-end" },
      { name: "submission-end", expectedKeys: { reason: "ACTION_ABORTED" } },
      { name: "submission-ready" },
    ]);
  });
});
