import { afterEach, describe, expect, it, vitest } from "vitest";
import {
  createFatalErrorComponent,
  createInputElement,
  createWrapperDiv,
} from "./ui";
import userEvent from "@testing-library/user-event";

afterEach(() => {
  document.body.replaceChildren();
});

describe("secure iframe ui - createInputElement - basics", () => {
  it("should create an input element", () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);
    expect(el).toBeInstanceOf(HTMLInputElement);
  });

  it("should fire focus and blur events", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);
    await expectEventToBeFired(
      el,
      { type: "secureinputevent", subtype: "focus" },
      () => el.focus(),
    );
    await expectEventToBeFired(
      el,
      { type: "secureinputevent", subtype: "blur" },
      () => el.blur(),
    );
  });
});

describe("secure iframe ui - createInputElement - credit_card_number", () => {
  it("should have credit card number attributes", () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);
    expect(el).toHaveAttribute("placeholder", "4000 0000 0000 0000");
    expect(el).toHaveAttribute("inputmode", "numeric");
    expect(el).toHaveAttribute("autocomplete", "cc-number");
  });

  it("should allow typing credit card numbers", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "4111111111111111" },
      },
      async () => {
        await userEvent.type(el, "4111111111111111");
        await userEvent.tab();
      },
    );

    // check formatting
    expect(el).toHaveValue("4111 1111 1111 1111 ");
  });

  it("should allow typing into middle of credit card numbers", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "4111112211" },
      },
      async () => {
        await userEvent.type(
          el,
          "4111 1111 {arrowleft}{arrowleft}{arrowleft}22",
        );
      },
    );

    // check formatting
    expect(el).toHaveValue("4111 1122 11");
  });

  it("should allow pasting credit card numbers", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "4111111111111111" },
      },
      async () => {
        await userEvent.click(el);
        await userEvent.paste("4111111111111111");
      },
    );

    // check formatting
    expect(el).toHaveValue("4111 1111 1111 1111 ");
  });

  it("should allow pasting credit card numbers with spaces", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "4111111111111111" },
      },
      async () => {
        await userEvent.click(el);
        await userEvent.paste("4111 1111 1111 1111");
      },
    );

    // check formatting
    expect(el).toHaveValue("4111 1111 1111 1111 ");
  });

  it("should not allow typing letters", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    await userEvent.type(el, "a1b2c3");
    expect(el).toHaveValue("123");
  });

  it("should move cursor backwards when backspacing a space", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    // should insert a space after 4 digits
    await userEvent.type(el, "12345");
    expect(el).toHaveValue("1234 5");

    // should remove the 5 but not the space, cursor should be before the space now
    await userEvent.type(el, "{backspace}{backspace}");
    expect(el).toHaveValue("1234 ");
    expect(el.selectionStart).toBe(4);
    expect(el.selectionEnd).toBe(4);
  });

  it("should move cursor forwards when deleting a space", async () => {
    const el = createInputElement("credit_card_number");
    document.body.appendChild(el);

    // should insert a space after 4 digits
    await userEvent.type(el, "12345");
    expect(el).toHaveValue("1234 5");

    // place the cursor before the space and delete forward, should move the cursor to after the space
    await userEvent.type(el, "{arrowleft}{arrowleft}{delete}");
    expect(el).toHaveValue("1234 5");
    expect(el.selectionStart).toBe(5);
    expect(el.selectionEnd).toBe(5);
  });
});

describe("secure iframe ui - createInputElement - credit_card_expiry", () => {
  it("should have credit card expiry attributes", () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);
    expect(el).toHaveAttribute("placeholder", "MM/YY");
    expect(el).toHaveAttribute("inputmode", "numeric");
    expect(el).toHaveAttribute("autocomplete", "cc-exp");
  });

  it("should allow typing credit card expiry", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "12/34" },
      },
      async () => {
        await userEvent.type(el, "1234");
        await userEvent.tab();
      },
    );

    // check formatting
    expect(el).toHaveValue("12/34");
  });

  it("should allow typing into middle of credit card expiry", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "14/23" },
      },
      async () => {
        await userEvent.type(el, "123{arrowleft}{arrowleft}{arrowleft}4");
      },
    );

    // check formatting
    expect(el).toHaveValue("14/23");
  });

  it("should allow deleting characters from the middle of credit card expiry", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "13/4" },
      },
      async () => {
        await userEvent.type(
          el,
          "1234{arrowleft}{arrowleft}{arrowleft}{arrowleft}{delete}", // delete the 2
        );
      },
    );

    // check formatting
    expect(el).toHaveValue("13/4");
  });

  it("should allow pasting credit card expiry", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "12/34" },
      },
      async () => {
        await userEvent.click(el);
        await userEvent.paste("1234");
      },
    );

    // check formatting
    expect(el).toHaveValue("12/34");
  });

  it("should allow pasting credit card expiry with slash", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "12/34" },
      },
      async () => {
        await userEvent.click(el);
        await userEvent.paste("12/34");
      },
    );

    // check formatting
    expect(el).toHaveValue("12/34");
  });

  it("should not allow typing letters", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    await userEvent.type(el, "a1b2");
    expect(el).toHaveValue("12/");
  });

  it("should not allow typing extra slashes", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    await userEvent.type(el, "12/3/4");
    expect(el).toHaveValue("12/34");
  });

  it("should insert leading zero if month has one digit", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    await userEvent.type(el, "1/23");
    expect(el).toHaveValue("01/23");
  });

  it("should not allow slash as the first character", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    await userEvent.type(el, "/12");
    expect(el).toHaveValue("12/");
  });

  it("should move cursor to before slash if user backspaces it", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    await userEvent.type(el, "12/{backspace}");
    expect(el).toHaveValue("12/");
    expect(el.selectionStart).toBe(2);
    expect(el.selectionEnd).toBe(2);
  });

  it("should move cursor after slash if user deletes it", async () => {
    const el = createInputElement("credit_card_expiry");
    document.body.appendChild(el);

    await userEvent.type(el, "12/{arrowleft}{delete}");
    expect(el).toHaveValue("12/");
    expect(el.selectionStart).toBe(3);
    expect(el.selectionEnd).toBe(3);
  });
});

describe("secure iframe ui - createInputElement - credit_card_cvn", () => {
  it("should have credit card cnv attributes", () => {
    const el = createInputElement("credit_card_cvn");
    document.body.appendChild(el);
    expect(el).toHaveAttribute("placeholder", "123");
    expect(el).toHaveAttribute("inputmode", "numeric");
    expect(el).toHaveAttribute("autocomplete", "cc-csc");
  });

  it("should allow typing credit card cvn", async () => {
    const el = createInputElement("credit_card_cvn");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "123" },
      },
      async () => {
        await userEvent.type(el, "123");
        await userEvent.tab();
      },
    );

    // check formatting
    expect(el).toHaveValue("123");
  });

  it("should not allow letters", async () => {
    const el = createInputElement("credit_card_cvn");
    document.body.appendChild(el);

    // check that typing fires change event
    await expectEventToBeFired(
      el,
      {
        type: "secureinputevent",
        subtype: "change",
        detail: { value: "12" },
      },
      async () => {
        await userEvent.type(el, "a1b2");
      },
    );

    // check formatting
    expect(el).toHaveValue("12");
  });
});

describe("secure iframe ui - createWrapperDiv", () => {
  it("should create wrapper div", () => {
    const el = createWrapperDiv();
    document.body.appendChild(el);
    expect(el.outerHTML).toMatchInlineSnapshot(
      `"<div class="input-wrapper" style="width: 100%; height: 100%; display: flex;"></div>"`,
    );
  });
});

describe("secure iframe ui - createFatalErrorComponent", () => {
  it("should create fatal error component", () => {
    const el = createFatalErrorComponent("error code");
    document.body.appendChild(el);
    expect(el.outerHTML).toMatchInlineSnapshot(
      `"<div style="color: red; font-family: monospace; font-size: 10px;">✕ error code</div>"`,
    );
  });
});

/**
 * Expect that calling fn results in a specific event being fired.
 */
async function expectEventToBeFired(
  element: HTMLInputElement,
  event: { [k: string]: unknown; type: string },
  fn: () => void,
) {
  const eventHandler = vitest.fn();
  element.addEventListener(event.type, eventHandler);
  await fn();
  expect(eventHandler).toHaveBeenCalled();

  let passes = 0;
  let lastError: Error | null = null;
  for (const call of eventHandler.mock.calls) {
    try {
      expect(call[0]).toMatchObject(event);
      passes++;
    } catch (e) {
      lastError = e as Error;
    }
  }
  if (passes === 0) {
    throw lastError;
  }
}
