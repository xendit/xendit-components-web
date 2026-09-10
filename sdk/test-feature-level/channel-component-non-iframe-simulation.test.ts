import { afterEach, describe, expect, it } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { XenditComponentsTest } from "../src";
import { internal } from "../src/internal";
import { assert } from "../src/utils";
import { waitForEvent } from "./utils";

afterEach(() => {
  document.body.replaceChildren();
});

/**
 * Force the SDK into "non-iframe" mode by removing the public key and signature
 * from the parsed sdk key. When these are absent, credit card fields render as
 * plain (non-iframe) inputs.
 */
function forceNonIframeMode(sdk: XenditComponentsTest) {
  const { sessionAuthKey, hostId } = sdk[internal].sdkKey;
  sdk[internal].sdkKey = { sessionAuthKey, hostId };
}

describe("channel component non-iframe simulation", () => {
  it("should populate non-iframe credit card fields when a scenario is selected", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");
    forceNonIframeMode(sdk);

    const ch = sdk.getActiveChannels({ filter: "CARDS" })[0];
    assert(ch);
    document.body.appendChild(sdk.createChannelComponent(ch));

    // fields should be plain inputs, not iframes
    expect(document.querySelector("iframe")).toBeNull();

    const cardNumberInput = document.querySelector<HTMLInputElement>(
      "input[id][autocomplete='cc-number']",
    );
    assert(cardNumberInput);

    // open the simulation scenario picker and select the first scenario
    // (the first CARDS_SCENARIOS entry is the VISA "3DS Challenge")
    const trigger = screen.getByText("Simulate scenario");
    fireEvent.click(trigger);

    const scenarioButton = await waitFor(() => {
      const button = document.querySelector<HTMLButtonElement>(
        ".xendit-form-simulation-list button",
      );
      assert(button);
      return button;
    });
    fireEvent.click(scenarioButton);

    // once the scenario is selected, all card fields are populated. Assert the
    // submitted (hidden) values as well as the visible card number formatting.
    // These are checked together so we capture the populated state in a single
    // render pass.
    await waitFor(() => {
      const cardNumberHidden = document.querySelector<HTMLInputElement>(
        "input[type='hidden'][name='card_details.card_number']",
      );
      const expiryHidden = document.querySelector<HTMLInputElement>(
        "input[type='hidden'][name='card_details.expiry_month__card_details.expiry_year']",
      );
      const cvnInput = document.querySelector<HTMLInputElement>(
        "input[name='card_details.cvn']",
      );

      // the visible card number input shows the formatted VISA test card
      // (the field appends a trailing space after each group of 4 digits)
      expect(cardNumberInput.value.trim()).toBe("4000 0000 0000 2503");
      // the hidden (submitted) card number value holds digits only
      expect(cardNumberHidden?.value).toBe("4000000000002503");
      // the hidden (submitted) expiry value holds [month, YYYY]
      expect(expiryHidden?.value).toBe(JSON.stringify(["12", "2099"]));
      // the cvn value is populated
      expect(cvnInput?.value).toBe("123");
    });
  });
});
