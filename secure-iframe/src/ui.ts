export interface HTMLElementTagNameMap {
  "secure-iframe-credit-card-input": SecureIframeCreditCardInput;
}

export interface HTMLElementEventMap {
  secureinputevent: SecureInputEvent;
}

export class SecureInputEvent extends Event {
  static type: "secureinputevent";
  subtype: "change" | "focus" | "blur";
  detail: {
    value?: string;
  };
  constructor(
    subtype: "change" | "focus" | "blur",
    detail: { value?: string } = {}
  ) {
    super("secureinputevent", {
      bubbles: true,
      composed: true
    });
    this.subtype = subtype;
    this.detail = detail;
  }
}

export function assertIsSecureInputEvent(
  event: Event
): asserts event is SecureInputEvent {
  if (event.type !== "secureinputevent") {
    throw new Error("Expected secureinputevent");
  }
}

export function createIframeInputElement(type: string) {
  switch (type) {
    case "credit_card_number":
      return document.createElement(
        "secure-iframe-credit-card-input"
      ) as SecureIframeCreditCardInput;
    default:
      // throw new Error(`Unsupported input type: ${type}`);
      return document.createElement("div");
  }
}

class SecureIframeCreditCardInput extends HTMLElement {
  static tag: string = "secure-iframe-credit-card-input";

  input: HTMLInputElement;

  isDeletingSpace: boolean = false;

  constructor() {
    super();
    this.input = document.createElement("input");
  }

  connectedCallback() {
    this.input.type = "text";
    this.input.placeholder = "Enter credit card number";

    this.input.inputMode = "numeric";
    this.input.autocomplete = "cc-number";

    this.appendChild(this.input);
    this.input.addEventListener("change", this.onChange);
    this.input.addEventListener("input", this.onInput as EventListener);
    this.input.addEventListener("beforeinput", this.onBeforeInput);
  }

  onBeforeInput = (event: InputEvent) => {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    const hasCollapsedSelection =
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd;

    const cursorPosition = input.selectionStart ?? 0;

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);

    // prevent non-numeric characters
    if (event.data && !/^\d+$/.test(event.data)) {
      event.preventDefault();
      return;
    }

    if (hasCollapsedSelection) {
      switch (event.inputType) {
        case "deleteContentBackward": {
          // if we would backspace a space, instead move the cursor back one character
          if (beforeCursor.endsWith(" ")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
            this.formatAndSendEvent();
          }
          break;
        }
        case "deleteContentForward": {
          // if we would delete a space, instead move the cursor forward one character
          if (afterCursor.startsWith(" ")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            this.formatAndSendEvent();
          }
          break;
        }
      }
    }
  };

  formatAndSendEvent() {
    const input = this.input;
    const value = input.value;

    const hasCollapsedSelection =
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd;

    const cursorPosition = input.selectionStart ?? 0;

    const raw = value.replace(/\s/g, "");

    // FIXME: module resolution issue
    // const cardType: CreditCardType | undefined = creditCardType(raw)[0];

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);

    // spaces go after digit n
    const spacePositions: Record<number, boolean> = {
      4: true,
      8: true,
      12: true
    };

    const out: string[] = [];

    let i = 1;
    for (const char of beforeCursor.replace(/\s/g, "").split("")) {
      out.push(char);
      if (spacePositions[i]) {
        out.push(" ");
      }
      i += 1;
    }

    let newCursorPosition = out.length;

    for (const char of afterCursor.replace(/\s/g, "").split("")) {
      out.push(char);
      if (spacePositions[i]) {
        out.push(" ");
      }
      i += 1;
    }

    // update input value
    const newValue = out.join("").trim();
    this.input.value = newValue;

    if (hasCollapsedSelection) {
      newCursorPosition = Math.min(newCursorPosition, newValue.length);
      this.input.setSelectionRange(newCursorPosition, newCursorPosition);
    } else {
      // if the selection was not collapsed, we don't change the selection
      // as it would be unexpected for the user
    }

    this.dispatchEvent(
      new SecureInputEvent("change", { value: value.replace(/\s/g, "") })
    );
  }

  onChange = (event: Event) => {
    this.formatAndSendEvent();
  };

  onInput = (event: InputEvent) => {
    this.formatAndSendEvent();
  };
}

customElements.define(
  SecureIframeCreditCardInput.tag,
  SecureIframeCreditCardInput
);
