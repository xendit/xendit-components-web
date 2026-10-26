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
  it("renders card brands on the picker group row, not inside the card number input", async () => {
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
    const pickerGroup = await waitFor(() => {
      const input = document.querySelector(".xendit-iframe-container");
      assert(input);
      const group = input.closest(".xendit-channel-picker-group");
      assert(group);
      return group as HTMLElement;
    });

    // brands render on the picker group row
    const brandsOnRow = pickerGroup.querySelector(".xendit-card-brands-list");
    expect(brandsOnRow).not.toBeNull();
    expect(
      pickerGroup.querySelectorAll(".xendit-card-brand-logo").length,
    ).toBeGreaterThan(0);

    // and NOT inside the card number input itself
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
