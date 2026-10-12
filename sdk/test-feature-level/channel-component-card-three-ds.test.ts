import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert } from "../src/utils";
import { internal } from "../src/internal";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel component card three ds", () => {
  it("should hide fields with the hide_on_skip_three_ds flag", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // email and mobile number are flagged with hide_on_skip_three_ds
    expect(
      document.querySelector("[name='card_details.cardholder_email']"),
    ).not.toBeInTheDocument();
    expect(
      document.querySelector("[name='card_details.cardholder_phone_number']"),
    ).not.toBeInTheDocument();

    // other card fields are still shown
    expect(
      document.querySelector("[name='card_details.card_number']"),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[name='card_details.cardholder_first_name']"),
    ).toBeInTheDocument();
  });

  it("should not include hidden fields in channel properties", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const cardDetails = sdk[internal].liveComponents.paymentChannels.get(
      "CARDS",
    )?.channelProperties?.card_details as Record<string, unknown> | undefined;
    assert(cardDetails);
    expect(cardDetails).not.toHaveProperty("cardholder_email");
    expect(cardDetails).not.toHaveProperty("cardholder_phone_number");
  });
});
