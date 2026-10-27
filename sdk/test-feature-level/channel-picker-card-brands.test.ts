import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, Writable } from "./utils";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
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

function fireIframeEvent(iframe: HTMLIFrameElement, data: IframeEvent) {
  const event = new Event("message") as Writable<MessageEvent>;
  event.source = iframe.contentWindow;
  event.origin = "https://xendit-secure-iframe";
  event.data = data;
  window.dispatchEvent(event);
}

async function typeCardNumber(iframe: HTMLIFrameElement, ciphertext: string) {
  fireIframeEvent(iframe, {
    type: "xendit-iframe-change",
    empty: false,
    valid: false,
    encrypted: [{ iv: "IV", value: ciphertext }],
    validationErrorCodes: [],
  });
  await sleep(300); // CardInfoBehavior debounce
}

// open the Mock Cards picker group (auto-selects the CARDS channel), returning
// the ready-to-drive card number iframe and the accordion item that holds the
// group-row brand logos.
async function openCardPicker() {
  const sdk = new XenditComponentsTest({
    componentsSdkKey: "test-client-key",
  });
  document.body.appendChild(sdk.createChannelPickerComponent());
  await waitForEvent(sdk, "init");

  const cardsGroup = screen.getByText("Mock Cards");
  await userEvent.click(cardsGroup);

  const accordionItem = await waitFor(() => {
    const input = document.querySelector(".xendit-iframe-container");
    assert(input);
    const item = input.closest(".xendit-accordion-item");
    assert(item);
    return item as HTMLElement;
  });

  const cardNumberInput = document.querySelector<HTMLInputElement>(
    "input[name='card_details.card_number']",
  );
  assert(cardNumberInput);
  const iframe = cardNumberInput.parentElement?.querySelector("iframe");
  assert(iframe);
  fireIframeEvent(iframe, {
    type: "xendit-iframe-ready",
    ecdhPublicKey: "PUBLICKEY",
  });
  await sleep(1);

  return { sdk, accordionItem, iframe };
}

// the group-row brand logo <img> elements and whether each is disabled.
function rowLogoStates(accordionItem: HTMLElement) {
  const imgs = accordionItem.querySelectorAll<HTMLImageElement>(
    ".xendit-accordion-item-logos img.xendit-accordion-item-logo-image",
  );
  return Array.from(imgs).map((img) => ({
    alt: img.getAttribute("alt"),
    disabled: img.classList.contains(
      "xendit-accordion-item-logo-image-disabled",
    ),
  }));
}

describe("channel picker card brands", () => {
  it("renders card brands as the credit card group's row logos, not inside the card number input", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // selecting the single-channel Mock Cards group auto-selects the CARDS
    // channel and mounts its component inside the picker group row.
    const cardsGroup = screen.getByText("Mock Cards");
    await userEvent.click(cardsGroup);

    // wait for the card number input to mount inside the picker.
    // with a public key present the card number field renders as a secure
    // iframe (`.xendit-iframe-container`).
    const accordionItem = await waitFor(() => {
      const input = document.querySelector(".xendit-iframe-container");
      assert(input);
      const item = input.closest(".xendit-accordion-item");
      assert(item);
      return item as HTMLElement;
    });

    // the card brand logos replace the generic card icon as the group-row logos
    // rendered by GroupLogos in the accordion item header.
    const rowLogos = accordionItem.querySelectorAll(
      ".xendit-accordion-item-logos img.xendit-accordion-item-logo-image",
    );
    const logoAlts = Array.from(rowLogos).map((img) => img.getAttribute("alt"));
    const logoSrcs = Array.from(rowLogos).map((img) => img.getAttribute("src"));
    expect(logoAlts).toEqual(["VISA", "MASTERCARD", "JCB"]);
    expect(logoSrcs).toEqual([
      "https://assets.xendit.co/payment-session/logos/VISA.svg",
      "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      "https://assets.xendit.co/payment-session/logos/JCB.svg",
    ]);
    // the generic card icon is no longer among the group-row logos
    expect(logoSrcs.some((src) => src?.endsWith("/CARDS.svg"))).toBe(false);

    // the standalone CardBrands block is gone from the picker group row
    const pickerGroup = accordionItem.querySelector(
      ".xendit-channel-picker-group",
    );
    assert(pickerGroup);
    expect(pickerGroup.querySelector(".xendit-card-brands-list")).toBeNull();

    // and the inline brands are NOT inside the card number input itself
    const cardInput = document.querySelector(".xendit-iframe-container");
    assert(cardInput);
    expect(cardInput.querySelector(".xendit-card-brands-list")).toBeNull();
  });

  it("renders card brands inside the card number input when created directly", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // no picker group is present in the direct path
    expect(document.querySelector(".xendit-channel-picker-group")).toBeNull();

    // brands render inside the card number input (the secure iframe
    // container), as before
    const cardInput = document.querySelector(".xendit-iframe-container");
    assert(cardInput);
    expect(cardInput.querySelector(".xendit-card-brands-list")).not.toBeNull();
    expect(
      cardInput.querySelectorAll(".xendit-card-brand-logo").length,
    ).toBeGreaterThan(0);
  });

  // The CARDS test channel has 3 brands (VISA, MASTERCARD, JCB), so none are
  // truncated into +N — the +N override index math is covered separately by the
  // GroupLogos unit test in sdk/src/components/core/accordion-item.test.tsx.
  // These feature tests drive the scheme-based enable/disable behavior end to end.

  it("disables the non-matching brand logos when the BIN lookup yields exactly one scheme", async () => {
    const { accordionItem, iframe } = await openCardPicker();

    // before typing, all brand logos are enabled
    expect(rowLogoStates(accordionItem)).toEqual([
      { alt: "VISA", disabled: false },
      { alt: "MASTERCARD", disabled: false },
      { alt: "JCB", disabled: false },
    ]);

    // a BIN lookup resolving to exactly one scheme (VISA) with a bin present so
    // card-bin-changed fires
    await typeCardNumber(
      iframe,
      cardInfoCiphertext({ schemes: ["VISA"], bin: "42345678" }),
    );
    await waitFor(() => {
      expect(rowLogoStates(accordionItem)).toEqual([
        { alt: "VISA", disabled: false },
        { alt: "MASTERCARD", disabled: true },
        { alt: "JCB", disabled: true },
      ]);
    });
  });

  it("leaves all brand logos enabled when the schemes carry more than one entry", async () => {
    const { accordionItem, iframe } = await openCardPicker();

    await typeCardNumber(
      iframe,
      cardInfoCiphertext({ schemes: ["VISA", "MASTERCARD"], bin: "42345678" }),
    );
    await waitFor(() => {
      const input = document.querySelector(".xendit-iframe-container");
      assert(input);
    });

    // more than one scheme -> no disabling, every brand stays enabled
    expect(rowLogoStates(accordionItem)).toEqual([
      { alt: "VISA", disabled: false },
      { alt: "MASTERCARD", disabled: false },
      { alt: "JCB", disabled: false },
    ]);
  });

  it("leaves all brand logos enabled when the single scheme matches no channel brand", async () => {
    const { accordionItem, iframe } = await openCardPicker();

    // single scheme that is not one of VISA/MASTERCARD/JCB -> co-brand edge case,
    // no change rather than disabling everything
    await typeCardNumber(
      iframe,
      cardInfoCiphertext({ schemes: ["DISCOVER"], bin: "42345678" }),
    );
    await sleep(1);

    expect(rowLogoStates(accordionItem)).toEqual([
      { alt: "VISA", disabled: false },
      { alt: "MASTERCARD", disabled: false },
      { alt: "JCB", disabled: false },
    ]);
  });
});
