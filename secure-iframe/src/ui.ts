import { SecureInputEvent } from "./events";

export function createWrapperDiv() {
  const wrapper = document.createElement("div");
  wrapper.className = "input-wrapper";
  return wrapper;
}

export function createInputElement(type: string) {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Enter credit card number";
  input.id = "secure-iframe-input";

  input.inputMode = "numeric";
  input.autocomplete = "cc-number";

  input.addEventListener("change", onChange);
  input.addEventListener("input", onInput);
  input.addEventListener("beforeinput", onBeforeInput);
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);

  function onBeforeInput(event: InputEvent) {
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
            formatAndSendEvent();
          }
          break;
        }
        case "deleteContentForward": {
          // if we would delete a space, instead move the cursor forward one character
          if (afterCursor.startsWith(" ")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            formatAndSendEvent();
          }
          break;
        }
      }
    }
  }

  function formatAndSendEvent() {
    const value = input.value;

    const hasCollapsedSelection =
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd;

    const cursorPosition = input.selectionStart ?? 0;

    const _raw = value.replace(/\s/g, "");

    // FIXME: module resolution issue
    // const cardType: CreditCardType | undefined = creditCardType(raw)[0];

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);

    // spaces go after digit n
    const spacePositions: Record<number, boolean> = {
      4: true,
      8: true,
      12: true,
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
    input.value = newValue;

    if (hasCollapsedSelection) {
      newCursorPosition = Math.min(newCursorPosition, newValue.length);
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    } else {
      // if the selection was not collapsed, we don't change the selection
      // as it would be unexpected for the user
    }

    input.dispatchEvent(
      new SecureInputEvent("change", { value: value.replace(/\s/g, "") }),
    );
  }

  function onChange(event: Event) {
    formatAndSendEvent();
  }

  function onInput(event: Event) {
    formatAndSendEvent();
  }

  function onFocus(event: Event) {
    input.dispatchEvent(new SecureInputEvent("focus", {}));
  }

  function onBlur(event: Event) {
    input.dispatchEvent(new SecureInputEvent("blur", {}));
  }

  return input;
}
