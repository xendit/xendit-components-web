import { describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForTelemetryEvent } from "./utils";

describe("sdk initialization telemetry", () => {
  it("should fire CHECKOUT_LOADED after sdk init", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");
    const event = await waitForTelemetryEvent(sdk, "CHECKOUT_LOADED", true);

    expect(event.metadata?.channels).toEqual(
      expect.arrayContaining([
        "CARDS",
        "MOCK_EWALLET",
        "MOCK_QR",
        "MOCK_VA",
        "UI_INPUT_TEST",
      ]),
    );
  });
});
