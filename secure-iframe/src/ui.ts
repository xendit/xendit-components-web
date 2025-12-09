import { IframeFieldType } from "../../shared/types";
import { SecureInputEvent } from "./events";

export function createWrapperDiv() {
  const wrapper = document.createElement("div");
  wrapper.className = "input-wrapper";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.display = "flex";
  return wrapper;
}

export function createInputElement(type: IframeFieldType) {
  const input = document.createElement("input");
  input.type = "text";
  input.id = "secure-iframe-input";
  input.style.width = "100%";
  input.style.fontSize = "14px";
  input.style.fontFamily = '"Proxima Nova", sans-serif';
  input.style.lineHeight = "16px";
  input.style.padding = "12px";
  input.style.border = "none";
  input.style.outline = "none";

  function onFocus(event: Event) {
    input.dispatchEvent(new SecureInputEvent("focus", {}));
  }
  function onBlur(event: Event) {
    input.dispatchEvent(new SecureInputEvent("blur", {}));
  }
  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);

  switch (type) {
    case "credit_card_number": {
      input.placeholder = "4000 0000 0000 0000";
      input.inputMode = "numeric";
      input.autocomplete = "cc-number";
      input.maxLength = 23; // 19 digits + 4 spaces
      creditCardNumberEvents(input);
      break;
    }
    case "credit_card_expiry": {
      input.placeholder = "MM/YY";
      input.inputMode = "numeric";
      input.autocomplete = "cc-exp";
      input.maxLength = 5;
      creditCardExpiryEvents(input);
      break;
    }
    case "credit_card_cvn": {
      input.type = "password";
      input.placeholder = "123";
      input.inputMode = "numeric";
      input.autocomplete = "cc-csc";
      input.maxLength = 4;
      creditCardCVNEvents(input);
      break;
    }
  }

  return input;
}

function creditCardNumberEvents(input: HTMLInputElement) {
  input.addEventListener("change", onChange);
  input.addEventListener("input", onInput);
  input.addEventListener("beforeinput", onBeforeInput);

  function onBeforeInput(event: InputEvent) {
    const { hasCollapsedSelection, beforeCursor, afterCursor, cursorPosition } =
      inputStats(input);

    // prevent non-numeric characters except space
    if (event.data && !/^[\d ]+$/.test(event.data)) {
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
          }
          break;
        }
        case "deleteContentForward": {
          // if we would delete a space, instead move the cursor forward one character
          if (afterCursor.startsWith(" ")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
          }
          break;
        }
      }
    }
  }

  function formatAndSendEvent() {
    const { value, hasCollapsedSelection, beforeCursor, afterCursor } =
      inputStats(input);

    // group digits in groups of 4
    const groupings: number[] = [4, 4, 4, 4];

    const out: string[] = [];

    for (const char of beforeCursor.replace(/\s/g, "").split("")) {
      out.push(char);
      groupings[0] -= 1;
      if (groupings[0] === 0) {
        groupings.shift();
        out.push(" ");
      }
    }

    let newCursorPosition = out.length;

    for (const char of afterCursor.replace(/\s/g, "").split("")) {
      out.push(char);
      groupings[0] -= 1;
      if (groupings[0] === 0) {
        groupings.shift();
        out.push(" ");
      }
    }

    // update input value
    const newValue = out.join("").trimStart();
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
}

function creditCardExpiryEvents(input: HTMLInputElement) {
  input.addEventListener("change", onChange);
  input.addEventListener("input", onInput);
  input.addEventListener("beforeinput", onBeforeInput);

  function onBeforeInput(event: InputEvent) {
    const { hasCollapsedSelection, beforeCursor, afterCursor, cursorPosition } =
      inputStats(input);

    // prevent characters except numbers and slash
    if (event.data && !/^[\d/]+$/.test(event.data)) {
      event.preventDefault();
      return;
    }

    if (event.data === "/") {
      if (beforeCursor === "") {
        // don't allow slash as first character
        event.preventDefault();
        return;
      }

      if (beforeCursor.includes("/")) {
        // already has a slash, ignore
        event.preventDefault();
        return;
      }

      // if user types a slash but has only entered one digit, add a leading zero
      if (beforeCursor.length === 1 && /^\d$/.test(beforeCursor)) {
        event.preventDefault();
        input.value = "0" + beforeCursor + "/";
        input.setSelectionRange(3, 3);
        return;
      }
    }

    if (hasCollapsedSelection) {
      switch (event.inputType) {
        case "deleteContentBackward": {
          // if we would backspace slash, instead move the cursor back one character
          if (beforeCursor.endsWith("/")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
          }
          break;
        }
        case "deleteContentForward": {
          // if we would delete a slash, instead move the cursor forward one character
          if (afterCursor.startsWith("/")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
          }
          break;
        }
      }
    }
  }

  function formatAndSendEvent() {
    const { value, hasCollapsedSelection, beforeCursor, afterCursor } =
      inputStats(input);

    const out: string[] = [];

    for (const char of beforeCursor.replace(/\//g, "").split("")) {
      out.push(char);
      if (out.length === 2) {
        out.push("/");
      }
    }

    let newCursorPosition = out.length;

    for (const char of afterCursor.replace(/\//g, "").split("")) {
      out.push(char);
      if (out.length === 2) {
        out.push("/");
      }
    }

    // update input value
    const newValue = out.join("");
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
}

function creditCardCVNEvents(input: HTMLInputElement) {
  input.addEventListener("change", onChange);
  input.addEventListener("input", onInput);
  input.addEventListener("beforeinput", onBeforeInput);

  function onBeforeInput(event: InputEvent) {
    // prevent non-numeric characters
    if (event.data && !/^[\d]+$/.test(event.data)) {
      event.preventDefault();
      return;
    }
  }

  function onChange(event: Event) {
    input.dispatchEvent(new SecureInputEvent("change", { value: input.value }));
  }

  function onInput(event: Event) {
    input.dispatchEvent(new SecureInputEvent("change", { value: input.value }));
  }
}

function inputStats(input: HTMLInputElement) {
  const value = input.value;

  const hasCollapsedSelection =
    input.selectionStart !== null &&
    input.selectionStart === input.selectionEnd;

  const cursorPosition = input.selectionStart ?? 0;

  const beforeCursor = value.slice(0, cursorPosition);
  const afterCursor = value.slice(cursorPosition);

  return {
    value,
    hasCollapsedSelection,
    cursorPosition,
    beforeCursor,
    afterCursor,
  };
}

export function createFatalErrorComponent(code: string) {
  const div = document.createElement("div");
  div.style.color = "red";
  div.style.fontFamily = "monospace";
  div.style.fontSize = "10px";
  div.textContent = `✕ ${code}`;
  return div;
}
