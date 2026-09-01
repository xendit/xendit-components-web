import { FunctionComponent } from "preact";
import { useCallback, useRef, useState } from "preact/hooks";
import { InternalSetFieldTouchedEvent } from "../private-event-types";
import { formFieldId, formFieldName } from "../utils";
import { useChannel, useChannelComponentData } from "./channel-root";
import { FieldProps } from "./field";

export const CreditCardNumberField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState("");
  const [focusWithin, setFocusWithin] = useState(false);

  const { card } = useChannel() ?? {};
  const channelData = useChannelComponentData();
  const schemes = channelData?.cardDetails?.details?.schemes;
  const selectedCardBrand =
    schemes?.find((scheme) => card?.brands?.some((b) => b.name === scheme)) ??
    null;

  const handleBeforeInput = useCallback((event: InputEvent) => {
    // prevent non-numeric characters except space
    if (event.data && !/^[\d ]+$/.test(event.data)) {
      event.preventDefault();
      return;
    }

    const input = inputRef.current;
    if (!input) return;

    const hasCollapsedSelection =
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd;
    const cursorPosition = input.selectionStart ?? 0;
    const beforeCursor = input.value.slice(0, cursorPosition);
    const afterCursor = input.value.slice(cursorPosition);

    if (hasCollapsedSelection) {
      switch (event.inputType) {
        case "deleteContentBackward": {
          // if we would backspace a space, move cursor back one character
          if (beforeCursor.endsWith(" ")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
          }
          break;
        }
        case "deleteContentForward": {
          // if we would delete a space, move cursor forward one character
          if (afterCursor.startsWith(" ")) {
            event.preventDefault();
            input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
          }
          break;
        }
      }
    }
  }, []);

  const formatAndUpdate = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart ?? 0;
    const hasCollapsedSelection =
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd;
    const beforeCursor = input.value.slice(0, cursorPosition);
    const afterCursor = input.value.slice(cursorPosition);

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

    const newValue = out.join("").trimStart();
    input.value = newValue;
    setDisplayValue(newValue);

    if (hasCollapsedSelection) {
      newCursorPosition = Math.min(newCursorPosition, newValue.length);
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    onChange();
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setFocusWithin(false);
    if (inputRef.current?.value) {
      inputRef.current.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
  }, []);

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <div
      className={`xendit-form-field-inner xendit-credit-card-input ${focusClass}`}
    >
      <input
        id={id}
        name={name}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="cc-number"
        placeholder="1234 1234 1234 1234"
        maxLength={23}
        className="xendit-text-14"
        value={displayValue}
        onBeforeInput={handleBeforeInput}
        onInput={formatAndUpdate}
        onFocus={() => setFocusWithin(true)}
        onBlur={handleBlur}
      />
      {field.type.name === "credit_card_number" && card && (
        <CardBrands
          cardsBrandList={card.brands}
          selectedCardBrand={selectedCardBrand}
        />
      )}
    </div>
  );
};

export const CreditCardExpiryField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState("");
  const [focusWithin, setFocusWithin] = useState(false);

  const handleBeforeInput = useCallback(
    (event: InputEvent) => {
      const input = inputRef.current;
      if (!input) return;

      const cursorPosition = input.selectionStart ?? 0;
      const hasCollapsedSelection =
        input.selectionStart !== null &&
        input.selectionStart === input.selectionEnd;
      const beforeCursor = input.value.slice(0, cursorPosition);
      const afterCursor = input.value.slice(cursorPosition);

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

        if (beforeCursor.includes("/") || afterCursor.includes("/")) {
          // already has a slash, ignore
          event.preventDefault();
          return;
        }

        // if user types a slash but has only entered one digit, add a leading zero
        if (beforeCursor.length === 1 && /^\d$/.test(beforeCursor)) {
          event.preventDefault();
          input.value = "0" + beforeCursor + "/";
          setDisplayValue(input.value);
          input.setSelectionRange(3, 3);
          updateHiddenValue(input.value);
          return;
        }
      }

      if (hasCollapsedSelection) {
        switch (event.inputType) {
          case "deleteContentBackward": {
            // if we would backspace slash, move cursor back one character
            if (beforeCursor.endsWith("/")) {
              event.preventDefault();
              input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
            }
            break;
          }
          case "deleteContentForward": {
            // if we would delete a slash, move cursor forward one character
            if (afterCursor.startsWith("/")) {
              event.preventDefault();
              input.setSelectionRange(cursorPosition + 1, cursorPosition + 1);
            }
            break;
          }
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const updateHiddenValue = useCallback(
    (formatted: string) => {
      if (!hiddenRef.current) return;

      const parts = formatted.split("/");
      const month = parts[0] ?? "";
      const year = parts[1] ?? "";

      if (month && year) {
        hiddenRef.current.value = JSON.stringify([month, year]);
      } else {
        hiddenRef.current.value = "";
      }
      onChange();
    },
    [onChange],
  );

  const formatAndUpdate = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;

    const cursorPosition = input.selectionStart ?? 0;
    const hasCollapsedSelection =
      input.selectionStart !== null &&
      input.selectionStart === input.selectionEnd;
    const beforeCursor = input.value.slice(0, cursorPosition);
    const afterCursor = input.value.slice(cursorPosition);

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

    const newValue = out.join("");
    input.value = newValue;
    setDisplayValue(newValue);

    if (hasCollapsedSelection) {
      newCursorPosition = Math.min(newCursorPosition, newValue.length);
      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    updateHiddenValue(newValue);
  }, [updateHiddenValue]);

  const handleBlur = useCallback(() => {
    setFocusWithin(false);
    if (hiddenRef.current?.value) {
      hiddenRef.current.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
  }, []);

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <>
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="cc-exp"
        placeholder="MM/YY"
        maxLength={5}
        className={`xendit-form-field-inner xendit-text-14 ${focusClass}`}
        value={displayValue}
        onBeforeInput={handleBeforeInput}
        onInput={formatAndUpdate}
        onFocus={() => setFocusWithin(true)}
        onBlur={handleBlur}
      />
      <input type="hidden" name={name} ref={hiddenRef} />
    </>
  );
};

export const CreditCardCvnField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [focusWithin, setFocusWithin] = useState(false);

  const handleBeforeInput = useCallback((event: InputEvent) => {
    // prevent non-numeric characters
    if (event.data && !/^\d+$/.test(event.data)) {
      event.preventDefault();
    }
  }, []);

  const handleInput = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    setValue(input.value);
    onChange();
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setFocusWithin(false);
    if (inputRef.current?.value) {
      inputRef.current.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
  }, []);

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <input
      id={id}
      name={name}
      ref={inputRef}
      type="password"
      inputMode="numeric"
      autoComplete="cc-csc"
      placeholder="123"
      maxLength={4}
      className={`xendit-form-field-inner xendit-text-14 ${focusClass}`}
      value={value}
      onBeforeInput={handleBeforeInput}
      onInput={handleInput}
      onFocus={() => setFocusWithin(true)}
      onBlur={handleBlur}
    />
  );
};

const CardBrands = ({
  cardsBrandList,
  selectedCardBrand,
}: {
  cardsBrandList: { name: string; logo_url: string }[];
  selectedCardBrand: string | null;
}) => {
  if (!cardsBrandList) return null;

  const cardBrandLogo = cardsBrandList.find(
    (b) => b.name === selectedCardBrand,
  )?.logo_url;

  return (
    <div className="xendit-card-brands-list">
      {selectedCardBrand
        ? cardBrandLogo && (
            <img
              className={"xendit-card-brand-logo"}
              src={cardBrandLogo}
              alt={selectedCardBrand}
            />
          )
        : cardsBrandList.map(({ name, logo_url }) => {
            return (
              <img
                className={"xendit-card-brand-logo"}
                src={logo_url}
                alt={name}
                key={name}
              />
            );
          })}
    </div>
  );
};
