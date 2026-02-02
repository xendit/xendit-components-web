import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, Writable } from "./utils";
import { assert, sleep } from "../src/utils";
import { screen } from "@testing-library/dom";
import { IframeEvent } from "../../shared/types";

afterEach(() => {
  document.body.replaceChildren();
});

const encodedError = btoa("validation.card_number_invalid");
const mockCardInfo = btoa(
  JSON.stringify({
    schemes: ["VISA"],
    country_codes: ["US"],
    require_billing_information: true,
  }),
);
const mockCardNumber = `xendit-encrypted-1-PUBLICKEY-IV-${mockCardInfo}-invalid-${encodedError}`;

describe("channel component card data", () => {
  it("should show cards channel with billing details after card info response", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const billingDetailsLabel = screen.queryByLabelText("Billing Details");
    expect(billingDetailsLabel).not.toBeInTheDocument();

    // find the card number iframe
    const cardNumberInput = document.querySelector<HTMLInputElement>(
      "input[name='card_details.card_number']",
    );
    assert(cardNumberInput);
    const iframeElement =
      cardNumberInput.parentElement?.querySelector("iframe");
    assert(iframeElement);

    // populate the public key
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-ready",
      ecdhPublicKey: "PUBLICKEY",
    });
    await sleep(1); // wait for rerender

    // simulate user typing card number
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: false,
      cardBrand: "VISA",
      encrypted: [
        {
          iv: "IV",
          value: mockCardInfo,
        },
      ],
      validationErrorCodes: [
        {
          localeKey: "validation.card_number_invalid",
        },
      ],
    });
    expect(cardNumberInput?.value).toBe(mockCardNumber);

    // 300ms debounce
    await sleep(300);

    const billingDetailsLabel2 = screen.queryByLabelText("Billing Address");
    expect(billingDetailsLabel2).toBeInTheDocument();
  });
});

function fireIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}
