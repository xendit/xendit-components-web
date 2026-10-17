import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { findEvent, waitForEvent, watchEvents } from "./utils";
import { assert } from "../src/utils";
import {
  InternalScheduleMockUpdateEvent,
  InternalUpdateWorldState,
} from "../src/private-event-types";
import { makeTestPollResponse } from "../src/data/test-data-modifiers";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
  // undo vi.setSystemTime
  vi.useRealTimers();
});

async function initSdk() {
  const sdk = new XenditComponentsTest({
    componentsSdkKey: "test-client-key",
  });
  await waitForEvent(sdk, "init");
  return sdk;
}

async function startQrPayment() {
  const sdk = await initSdk();
  const channel = sdk
    .getActiveChannels()
    .find((ch) => ch.channelCode === "MOCK_QR");
  assert(channel);
  document.body.appendChild(sdk.createChannelComponent(channel));
  setTimeout(() => sdk.submit());
  await waitForEvent(sdk, "action-begin");
  return { sdk, channel };
}

// like a poll/stream result: the session again, with a new TTL in seconds
function receiveSessionTtl(sdk: XenditComponentsTest, expiresTtl: number) {
  sdk.dispatchEvent(
    new InternalUpdateWorldState({
      session: {
        ...sdk[internal].worldState!.session,
        expires_ttl: expiresTtl,
      },
    }),
  );
}

describe("sdk session expiry on the form", () => {
  it("should expire when the TTL runs out", async () => {
    const sdk = await initSdk();
    const picker = sdk.createChannelPickerComponent();
    document.body.appendChild(picker);
    expect(picker.childElementCount).toBeGreaterThan(0);
    const statuses: string[] = [];
    sdk.addEventListener("session-expired-or-canceled", () => {
      statuses.push(sdk.getSession().status);
    });

    receiveSessionTtl(sdk, 1);
    expect(sdk.getSession().status).toBe("ACTIVE");
    await waitForEvent(sdk, "session-expired-or-canceled");

    // the merchant already reads EXPIRED inside the event handler
    expect(statuses).toEqual(["EXPIRED"]);
    expect(picker.childElementCount).toBe(0);
    expect(() => sdk.pollImmediately()).toThrow("not longer active");
    // the mock session has no cancel_return_url
    expect(() => sdk.redirectToReturnUrl()).toThrow("cancel_return_url");
  });

  it("should stay expired when the device clock is set back", async () => {
    const sdk = await initSdk();
    const events = watchEvents(sdk, ["session-expired-or-canceled"]);
    receiveSessionTtl(sdk, 0);

    vi.setSystemTime(Date.now() - 60_000);
    const channel = sdk.getActiveChannels()[0];
    assert(channel);
    sdk.setCurrentChannel(channel); // updates the behavior tree

    expect(sdk.getSession().status).toBe("EXPIRED");
    expect(events).toHaveLength(1);
  });

  it("should ignore a digital wallet payment after expiry", async () => {
    const sdk = await initSdk();
    receiveSessionTtl(sdk, 0);
    const channel = sdk.getActiveChannels({ filter: "UI_INPUT_TEST" })[0];
    assert(channel);

    sdk.submitDigitalWallet("GOOGLE_PAY", channel, { google_pay: "..." }, true);

    expect(sdk.getSession().status).toBe("EXPIRED");
    expect(sdk[internal].currentDigitalWalletSubmission).toBeNull();
  });
});

describe("sdk session expiry when a submission ends after the TTL ran out", () => {
  it("should end an aborted submission with its real reason", async () => {
    const { sdk } = await startQrPayment();
    receiveSessionTtl(sdk, 0);
    // the server decides during a submission
    expect(sdk.getSession().status).toBe("ACTIVE");
    const events = watchEvents(sdk, [
      "submission-ready",
      "submission-not-ready",
      "submission-end",
      "session-expired-or-canceled",
    ]);

    const expired = waitForEvent(sdk, "session-expired-or-canceled");
    sdk.abortSubmission();
    await expired;

    expect(events.map((e) => e.name)).toEqual([
      "submission-end",
      "session-expired-or-canceled",
    ]);
    expect(findEvent(events, "submission-end")?.event).toMatchObject({
      reason: "ACTION_ABORTED",
    });
  });

  it("should end a failed submission with its real reason", async () => {
    const { sdk, channel } = await startQrPayment();
    receiveSessionTtl(sdk, 0);
    const events = watchEvents(sdk, [
      "submission-ready",
      "submission-not-ready",
      "submission-end",
      "session-expired-or-canceled",
    ]);

    sdk.dispatchEvent(
      new InternalScheduleMockUpdateEvent(
        makeTestPollResponse(
          sdk[internal].worldState!,
          channel[internal][0],
          "FAILURE",
        ),
      ),
    );
    await waitForEvent(sdk, "session-expired-or-canceled");

    expect(events.map((e) => e.name)).toEqual([
      "submission-end",
      "session-expired-or-canceled",
    ]);
    expect(findEvent(events, "submission-end")?.event).toMatchObject({
      reason: "PAYMENT_REQUEST_FAILED",
    });
  });
});
