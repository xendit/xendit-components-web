import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, Writable } from "./utils";
import { assert, sleep } from "../src/utils";
import { IframeEvent } from "../../shared/types";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  document.body.replaceChildren();
});

const cardInfo = (requireBillingInformation: boolean) =>
  btoa(
    JSON.stringify({
      schemes: ["VISA"],
      country_codes: ["US"],
      require_billing_information: requireBillingInformation,
    }),
  );

describe("channel properties changed", () => {
  it("fires with the current form data as a field is typed into", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const firstNameInput = document.querySelector<HTMLInputElement>(
      "input[name='card_details.cardholder_first_name']",
    );
    assert(firstNameInput);

    // listen after rendering, so the initial render's event isn't counted
    const onChanged = vi.fn();
    sdk.addEventListener("channel-properties-changed", onChanged);

    await userEvent.type(firstNameInput, "Dewa");

    expect(onChanged).toHaveBeenCalled();
    const lastCall = onChanged.mock.calls[onChanged.mock.calls.length - 1][0];
    expect(lastCall.channelCode).toBe("CARDS");
    expect(lastCall.channelProperties.card_details.cardholder_first_name).toBe(
      "Dewa",
    );
  });

  it("includes the card number as an encrypted string", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const cardNumberInput = document.querySelector<HTMLInputElement>(
      "input[name='card_details.card_number']",
    );
    assert(cardNumberInput);
    const iframeElement =
      cardNumberInput.parentElement?.querySelector("iframe");
    assert(iframeElement);

    // populate the public key, otherwise the change event below is ignored
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-ready",
      ecdhPublicKey: "PUBLICKEY",
    });

    const onChanged = vi.fn();
    sdk.addEventListener("channel-properties-changed", onChanged);

    // simulate user typing card number
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "CARD_VALUE" }],
      validationErrorCodes: [],
    });

    expect(onChanged).toHaveBeenCalled();
    // present (properties are sent unfiltered) but as ciphertext, never digits
    const lastCall = onChanged.mock.calls[onChanged.mock.calls.length - 1][0];
    expect(lastCall.channelProperties.card_details.card_number).toContain(
      "xendit-encrypted",
    );
  });

  it("fires when fields are removed from the form", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });
    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    const cardNumberInput = document.querySelector<HTMLInputElement>(
      "input[name='card_details.card_number']",
    );
    assert(cardNumberInput);
    const iframeElement =
      cardNumberInput.parentElement?.querySelector("iframe");
    assert(iframeElement);

    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-ready",
      ecdhPublicKey: "PUBLICKEY",
    });

    const onChanged = vi.fn();
    sdk.addEventListener("channel-properties-changed", onChanged);

    // a card that needs billing details, so the billing fields mount
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: cardInfo(true) }],
      validationErrorCodes: [],
    });
    await sleep(400); // the card details lookup is debounced by 300ms
    const withBilling =
      onChanged.mock.calls[onChanged.mock.calls.length - 1][0];
    expect(withBilling.channelProperties.billing_information).toBeDefined();

    // switching to a card that doesn't unmounts them again
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: cardInfo(false) }],
      validationErrorCodes: [],
    });
    await sleep(400);

    // removing a key is a change too, so merchants must be told about it
    const withoutBilling =
      onChanged.mock.calls[onChanged.mock.calls.length - 1][0];
    expect(
      withoutBilling.channelProperties.billing_information,
    ).toBeUndefined();
  });
});

function fireIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}
