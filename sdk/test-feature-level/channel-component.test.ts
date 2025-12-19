import { afterEach, describe, expect, it } from "vitest";
import { XenditSessionTestSdk } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

describe("initialization", () => {
  it("should render channel picker component", async () => {
    const sdk = new XenditSessionTestSdk({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getAvailablePaymentChannels()
      .find((c) => c.channelCode === "MANDIRI_VIRTUAL_ACCOUNT");
    assert(ch);
    document.body.appendChild(sdk.createPaymentComponentForChannel(ch));

    const el = document.body.querySelector("xendit-payment-channel");
    expect(el).toBeInTheDocument();
  });

  it("should render channel picker component with single input form", async () => {
    const sdk = new XenditSessionTestSdk({
      sessionClientKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk
      .getAvailablePaymentChannels()
      .find((c) => c.channelCode === "INDOMARET");
    assert(ch);
    document.body.appendChild(sdk.createPaymentComponentForChannel(ch));

    const el = document.body.querySelector("xendit-payment-channel");
    assert(el);

    const form = el?.querySelector("form");
    assert(form);

    const inputs = form.elements;
    expect(inputs).toHaveLength(1);
    if (!(inputs[0] instanceof HTMLInputElement)) {
      throw new Error("Expected input element");
    }
    expect(inputs[0].labels?.length).toBe(1);
    expect(inputs[0].labels?.item(0)?.textContent).toBe("Payer Name");
  });
});
