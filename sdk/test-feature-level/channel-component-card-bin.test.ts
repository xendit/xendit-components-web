import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, Writable } from "./utils";
import { assert, sleep } from "../src/utils";
import { IframeEvent } from "../../shared/types";

afterEach(() => {
  document.body.replaceChildren();
});

function cardInfoCiphertext(overrides: Record<string, unknown>): string {
  return btoa(
    JSON.stringify({
      schemes: ["VISA"],
      country_codes: ["ID"],
      require_billing_information: false,
      bin: null,
      ...overrides,
    }),
  );
}

async function typeCardNumber(
  iframe: HTMLIFrameElement,
  ciphertext: string,
  valid = false,
) {
  fireIframeEvent(iframe, {
    type: "xendit-iframe-change",
    empty: false,
    valid,
    encrypted: [{ iv: "IV", value: ciphertext }],
    validationErrorCodes: [],
  });
  await sleep(300); // CardInfoBehavior debounce
}

describe("channel component card bin", () => {
  it("fires card-bin-changed once the card_info response carries a bin, and dedupes", async () => {
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
    await sleep(1);

    const onCardBinChanged = vi.fn();
    sdk.addEventListener("card-bin-changed", onCardBinChanged);

    // scheme known, not enough digits -> bin: null -> no event
    await typeCardNumber(iframeElement, cardInfoCiphertext({ bin: null }));
    expect(onCardBinChanged).not.toHaveBeenCalled();

    // bin present -> fires once, carrying the card metadata from the same response
    await typeCardNumber(
      iframeElement,
      cardInfoCiphertext({ bin: "42345678" }),
    );
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);
    expect(onCardBinChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        channelCode: "CARDS",
        bin: "42345678",
        schemes: ["VISA"],
        countryCodes: ["ID"],
      }),
    );

    // later response, same bin (different payload so a fresh lookup runs) -> no new event
    await typeCardNumber(
      iframeElement,
      cardInfoCiphertext({
        bin: "42345678",
        require_billing_information: true,
      }),
    );
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);

    // different bin -> fires again, and a co-badged card reports every scheme
    await typeCardNumber(
      iframeElement,
      cardInfoCiphertext({
        bin: "99999999",
        schemes: ["VISA", "GPN"],
        country_codes: ["ID"],
      }),
      true,
    );
    expect(onCardBinChanged).toHaveBeenCalledTimes(2);
    expect(onCardBinChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({
        channelCode: "CARDS",
        bin: "99999999",
        schemes: ["VISA", "GPN"],
        countryCodes: ["ID"],
      }),
    );
  });

  it("stays silent when the card field is cleared", async () => {
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
    await sleep(1);

    const onCardBinChanged = vi.fn();
    sdk.addEventListener("card-bin-changed", onCardBinChanged);

    await typeCardNumber(
      iframeElement,
      cardInfoCiphertext({ bin: "42345678" }),
      true,
    );
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);

    // clear the field -> card_info has no bin -> merchant keeps the last bin, no event
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: true,
      valid: false,
      encrypted: [{ iv: "IV", value: "" }],
      validationErrorCodes: [],
    });
    await sleep(300);
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);
  });
});

function fireIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}
