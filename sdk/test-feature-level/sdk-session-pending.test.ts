import { describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { assert } from "../src/utils";
import { InternalScheduleMockUpdateEvent } from "../src/private-event-types";
import { makeTestPollResponse } from "../src/data/test-data-modifiers";
import { internal } from "../src/internal";

describe("sdk session pending", () => {
  it("should fire session-pending event", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    await waitForEvent(sdk, "init");

    // start a fpx payment, it should make the session pending
    const channel = sdk
      .getActiveChannels()
      .find((ch) => ch.channelCode === "MOCK_FPX_BUSINESS");
    assert(channel);
    document.body.appendChild(sdk.createChannelComponent(channel));
    setTimeout(() => sdk.submit());

    await waitForEvent(sdk, "session-pending");

    // then make the session completed
    sdk.dispatchEvent(
      new InternalScheduleMockUpdateEvent(
        makeTestPollResponse(
          sdk[internal].worldState!,
          channel[internal][0],
          "SESSION_COMPLETED",
        ),
      ),
    );

    await waitForEventSequence(sdk, [
      { name: "session-not-pending" },
      { name: "session-complete" },
    ]);
  });
});
