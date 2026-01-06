import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("initialization", () => {
  it("should render channel picker component", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "MOCK_EWALLET");
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const el = document.body.querySelector("xendit-payment-channel");
    expect(el).toBeInTheDocument();
  });

  it("should render channel picker component with single input form", async () => {
    const sdk = new XenditComponentsTest({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getActiveChannels()
      .find((c) => c.channelCode === "MOCK_EWALLET_WITH_PHONE");
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const el = document.body.querySelector("xendit-payment-channel");
    assert(el);

    const form = el?.querySelector("form");
    assert(form);

    // phone inputs have extra elements, but only one should have name attribute
    const inputs = Array.from(form.elements).filter((el) =>
      el.getAttribute("name"),
    );
    expect(inputs).toHaveLength(1);

    if (!(inputs[0] instanceof HTMLInputElement)) {
      throw new Error("Expected input element");
    }
  });
});
