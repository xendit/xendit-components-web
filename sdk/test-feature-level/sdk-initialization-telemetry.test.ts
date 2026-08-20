import { describe, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForTelemetryEvent } from "./utils";

describe("sdk initialization telemetry", () => {
  it("should fire CHECKOUT_LOADED after sdk init", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");
    await waitForTelemetryEvent(sdk, "CHECKOUT_LOADED", true);
  });
});
