import { describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { internal } from "../src/internal";
import { BffSessionStatus } from "../src/backend-types/session";

describe("sdk fatal error", () => {
  it("should fire a fatal error event", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    await waitForEvent(sdk, "init");

    setTimeout(() => {
      // easiest way to force a crash is to set an invalid session status
      sdk[internal].worldState!.session.status = "OH_NO" as BffSessionStatus;
      // then trigger an update
      const channel = sdk.getActiveChannels()[0];
      sdk.createChannelComponent(channel);
    });

    await waitForEvent(sdk, "fatal-error");
  });
});
