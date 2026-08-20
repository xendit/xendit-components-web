import { describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";
import { InternalScheduleMockUpdateEvent } from "../src/private-event-types";
import { makeTestPollResponse } from "../src/data/test-data-modifiers";
import { internal } from "../src/internal";

describe("sdk session expired", () => {
  it("should fire session-expired-or-cancelled event", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    await waitForEvent(sdk, "init");

    // start a qr payment
    const channel = sdk
      .getActiveChannels()
      .find((ch) => ch.channelCode === "MOCK_QR");
    assert(channel);
    document.body.appendChild(sdk.createChannelComponent(channel));
    setTimeout(() => sdk.submit());

    await waitForEvent(sdk, "action-begin");

    // then simulate expiry during polling the qr status
    sdk.dispatchEvent(
      new InternalScheduleMockUpdateEvent(
        makeTestPollResponse(
          sdk[internal].worldState!,
          channel[internal][0],
          "SESSION_EXPIRED",
        ),
      ),
    );

    await waitForEvent(sdk, "session-expired-or-canceled");
  });
});
