import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, Writable } from "./utils";
import { assert } from "../src/utils";
import { IframeEvent } from "../../shared/types";

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel component card bin", () => {
  it("fires card-bin-changed once 8 digits are entered, dedupes repeats, and fires again on a new bin", async () => {
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

    const onCardBinChanged = vi.fn();
    sdk.addEventListener("card-bin-changed", onCardBinChanged);

    // fewer than 6 digits: no bin sent, no event
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: false,
      encrypted: [{ iv: "IV", value: "VALUE1" }],
      validationErrorCodes: [],
    });
    expect(onCardBinChanged).not.toHaveBeenCalled();

    // 6 digits: event fires with the 6 digit bin
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: false,
      encrypted: [{ iv: "IV", value: "VALUE1B" }],
      validationErrorCodes: [],
      bin: "423456",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);
    expect(onCardBinChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ channelCode: "CARDS", bin: "423456" }),
    );

    // 7th digit: bin is still the same 6 digits, so no new event
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: false,
      encrypted: [{ iv: "IV", value: "VALUE1C" }],
      validationErrorCodes: [],
      bin: "423456",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);

    // 8 digits: event fires again, now with the 8 digit bin
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: false,
      encrypted: [{ iv: "IV", value: "VALUE2" }],
      validationErrorCodes: [],
      bin: "42345678",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(2);
    expect(onCardBinChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ channelCode: "CARDS", bin: "42345678" }),
    );

    // customer keeps typing more digits, same bin: should not fire again
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "VALUE3" }],
      validationErrorCodes: [],
      bin: "42345678",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(2);

    // customer replaces the card number entirely, new bin: fires again
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "VALUE4" }],
      validationErrorCodes: [],
      bin: "99999999",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(3);
    expect(onCardBinChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ channelCode: "CARDS", bin: "99999999" }),
    );

    // customer clears the field entirely, then retypes the exact same bin
    // as before the clear: should fire again, since the field really did
    // become unknown and then known again
    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: true,
      valid: false,
      encrypted: [{ iv: "IV", value: "VALUE5" }],
      validationErrorCodes: [],
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(3);

    fireIframeEvent(iframeElement, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "VALUE6" }],
      validationErrorCodes: [],
      bin: "99999999",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(4);
    expect(onCardBinChanged).toHaveBeenLastCalledWith(
      expect.objectContaining({ channelCode: "CARDS", bin: "99999999" }),
    );
  });

  it("does not let typing in the CVN or expiry fields reset or re-fire the card bin", async () => {
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
    const cardNumberIframe =
      cardNumberInput.parentElement?.querySelector("iframe");
    assert(cardNumberIframe);

    const cvnInput = document.querySelector<HTMLInputElement>(
      "input[name='card_details.cvn']",
    );
    assert(cvnInput);
    const cvnIframe = cvnInput.parentElement?.querySelector("iframe");
    assert(cvnIframe);

    fireIframeEvent(cardNumberIframe, {
      type: "xendit-iframe-ready",
      ecdhPublicKey: "PUBLICKEY",
    });
    fireIframeEvent(cvnIframe, {
      type: "xendit-iframe-ready",
      ecdhPublicKey: "PUBLICKEY",
    });

    const onCardBinChanged = vi.fn();
    sdk.addEventListener("card-bin-changed", onCardBinChanged);

    // customer finishes typing the card number: bin fires once
    fireIframeEvent(cardNumberIframe, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "CARD_VALUE" }],
      validationErrorCodes: [],
      bin: "42345678",
    });
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);

    // customer moves to the CVN field and types in it - its own iframe never
    // computes a bin (input_type is credit_card_cvn), so this change event
    // carries no `bin` at all
    fireIframeEvent(cvnIframe, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "CVN_VALUE_1" }],
      validationErrorCodes: [],
    });
    fireIframeEvent(cvnIframe, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "CVN_VALUE_2" }],
      validationErrorCodes: [],
    });

    // the CVN activity must not reset the channel's cached bin or fire
    // card-bin-changed again
    expect(onCardBinChanged).toHaveBeenCalledTimes(1);

    // customer goes back to the card number field and keeps typing (e.g. a
    // 9th digit) - the bin prefix is unchanged, so this must not re-fire
    // either, even after the CVN activity in between
    fireIframeEvent(cardNumberIframe, {
      type: "xendit-iframe-change",
      empty: false,
      valid: true,
      encrypted: [{ iv: "IV", value: "CARD_VALUE_2" }],
      validationErrorCodes: [],
      bin: "42345678",
    });
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
