import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert, sleep } from "../src/utils";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
});

describe("sdk submit with push notification action", () => {
  it("should submit with push notification action", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({
      filter: "MOCK_EWALLET_PUSH_NOTIFICATION",
    })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    // it should show the instructions text in a modal
    expect(screen.getByText("Awaiting payment...")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Check the notification in your Mock E-Wallet Channel (Push notification action) app to complete your payment.",
      ),
    ).toBeInTheDocument();
  });

  it("should submit and abort when the modal is closed", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({
      filter: "MOCK_EWALLET_PUSH_NOTIFICATION",
    })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    // it should show the instructions text in a modal
    expect(screen.getByText("Awaiting payment...")).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Close" }));

    await waitForEventSequence(sdk, [
      { name: "action-end" },
      { name: "submission-end", expectedKeys: { reason: "ACTION_ABORTED" } },
      { name: "submission-ready" },
    ]);
  });

  it("should submit and the action should stay open even after the PR changes to pending state", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({
      filter: "MOCK_EWALLET_PUSH_NOTIFICATION",
    })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // submit and wait for completion
    setTimeout(() => sdk.submit());
    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "action-begin" },
    ]);

    // it should show the instructions text in a modal
    expect(screen.getByText("Awaiting payment...")).toBeInTheDocument();

    /**
     * In mock mode, it'll automatically go from ACTION_REQUIRED -> PENDING -> SUCCESS with a short delay.
     * We need to catch the pending state and make sure that the UI is still showing.
     */
    let tries = 100;
    while (tries--) {
      if (
        sdk[internal].worldState?.paymentEntity?.entity.status === "PENDING"
      ) {
        break;
      }
      await sleep(10);
    }

    // it should be in pending state after a while
    expect(sdk[internal].worldState?.paymentEntity?.entity.status).toBe(
      "PENDING",
    );
    expect(sdk[internal].worldState?.session.status).toBe("ACTIVE");

    // it should still be showing the instructions text
    expect(screen.getByText("Awaiting payment...")).toBeInTheDocument();
  });
});
