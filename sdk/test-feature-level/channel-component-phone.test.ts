import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent } from "./utils";
import { assert, sleep } from "../src/utils";
import { internal } from "../src/internal";
import { screen } from "@testing-library/dom";

afterEach(() => {
  document.body.replaceChildren();
});

async function renderPhoneChannel() {
  const sdk = new XenditComponentsTest({
    componentsSdkKey: "test-client-key",
  });

  await waitForEvent(sdk, "init");

  const ch = sdk.getActiveChannels({ filter: "MOCK_EWALLET_WITH_PHONE" })[0];
  assert(ch);
  document.body.appendChild(sdk.createChannelComponent(ch));

  await sleep(1);

  const input = screen.getByLabelText("Phone Number") as HTMLInputElement;
  const countryButton = document.querySelector(
    ".xendit-input-phone button",
  ) as HTMLButtonElement;

  return {
    input,
    countryButton,
    phoneNumberProperty: () =>
      sdk[internal].liveComponents.paymentChannels.get(
        "MOCK_EWALLET_WITH_PHONE",
      )?.channelProperties?.phone_number_field,
  };
}

function typeValue(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, inputType: "insertText" }),
  );
}

function pasteValue(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(
    new InputEvent("input", { bubbles: true, inputType: "insertFromPaste" }),
  );
}

// autofill replaces the whole value without an inputType and follows it with a change event
function autofillValue(input: HTMLInputElement, value: string) {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("channel component phone field test", () => {
  it("moves the dropdown and strips the dial code when an international number is pasted", async () => {
    const { input, countryButton, phoneNumberProperty } =
      await renderPhoneChannel();
    expect(countryButton.textContent).toBe("+62");

    pasteValue(input, "+6591234567");
    await sleep(1); // wait for the re-render

    expect(countryButton.textContent).toBe("+65");
    expect(input.value).toBe("9123 4567");
    expect(phoneNumberProperty()).toBe("+6591234567");
  });

  it("moves the dropdown when the browser autofills", async () => {
    const { input, countryButton, phoneNumberProperty } =
      await renderPhoneChannel();

    autofillValue(input, "+6591234567");
    await sleep(1);

    expect(countryButton.textContent).toBe("+65");
    expect(input.value).toBe("9123 4567");
    expect(phoneNumberProperty()).toBe("+6591234567");
  });

  it("moves the dropdown on blur when the number was typed by hand", async () => {
    const { input, countryButton, phoneNumberProperty } =
      await renderPhoneChannel();

    input.focus();
    typeValue(input, "+6591234567");
    await sleep(1);

    // typing alone changes nothing
    expect(countryButton.textContent).toBe("+62");
    expect(input.value).toBe("+6591234567");

    // losing focus after an edit commits the value with a change event, then focusout
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.blur();
    await sleep(1);

    expect(countryButton.textContent).toBe("+65");
    expect(input.value).toBe("9123 4567");
    expect(phoneNumberProperty()).toBe("+6591234567");
  });

  it("leaves a number alone while a + is typed in front of it", async () => {
    const { input, countryButton } = await renderPhoneChannel();

    typeValue(input, "812 3456 789");
    await sleep(1);

    typeValue(input, "+812 3456 789");
    await sleep(1);

    expect(countryButton.textContent).toBe("+62");
    expect(input.value).toBe("+812 3456 789");
  });

  it("ignores an incomplete pasted number", async () => {
    const { input, countryButton } = await renderPhoneChannel();

    pasteValue(input, "+65912");
    await sleep(1);

    expect(countryButton.textContent).toBe("+62");
    expect(input.value).toBe("+65912");
  });

  it("leaves a typed local number alone", async () => {
    const { input, countryButton, phoneNumberProperty } =
      await renderPhoneChannel();

    typeValue(input, "0812 3456 789");
    await sleep(1);

    expect(countryButton.textContent).toBe("+62");
    expect(input.value).toBe("0812 3456 789");
    expect(phoneNumberProperty()).toBe("+628123456789");
  });

  it("leaves the dropdown alone for a number that cannot exist", async () => {
    const { input, countryButton } = await renderPhoneChannel();

    // the right length for Singapore, but no Singapore number starts with 1
    pasteValue(input, "+6512345678");
    await sleep(1);

    expect(countryButton.textContent).toBe("+62");
    expect(input.value).toBe("+6512345678");
  });

  it("records a value that is committed without an input event", async () => {
    const { input, countryButton, phoneNumberProperty } =
      await renderPhoneChannel();

    // some password managers set the value and only dispatch change
    input.value = "+6512345678";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(1);

    // the number is not valid, so the dropdown stays put, but it must still be submitted
    expect(countryButton.textContent).toBe("+62");
    expect(input.value).toBe("+6512345678");
    expect(phoneNumberProperty()).toBe("+6512345678");
  });

  const formattingCases = [
    {
      pasted: "+65 87654321",
      dial: "+65",
      local: "8765 4321",
      submitted: "+6587654321",
    },
    {
      pasted: "+62 812 1234 1234",
      dial: "+62",
      local: "812 1234 1234",
      submitted: "+6281212341234",
    },
    {
      pasted: "+62 0812 1234 1234",
      dial: "+62",
      local: "812 1234 1234",
      submitted: "+6281212341234",
    },
    {
      pasted: "+61 0431 123 123",
      dial: "+61",
      local: "431 123 123",
      submitted: "+61431123123",
    },
    {
      pasted: "+1 212 (555) 4321",
      dial: "+1",
      local: "212 555 4321",
      submitted: "+12125554321",
    },
  ];

  for (const { pasted, dial, local, submitted } of formattingCases) {
    it(`formats ${pasted} as ${dial} ${local}`, async () => {
      const { input, countryButton, phoneNumberProperty } =
        await renderPhoneChannel();

      pasteValue(input, pasted);
      await sleep(1);

      expect(countryButton.textContent).toBe(dial);
      expect(input.value).toBe(local);
      expect(phoneNumberProperty()).toBe(submitted);
    });
  }
});
