import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { assert } from "../src/utils";

afterEach(() => {
  document.body.replaceChildren();
});

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
});
