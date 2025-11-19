import { useCallback, useEffect, useRef, useState } from "react";
import { ChannelFormField } from "../backend-types/channel";
import { FieldProps } from "./field";
import { validate } from "../validation";
import { InternalInputValidateEvent } from "../private-event-types";
import { formFieldName } from "../utils";
import { LocaleKey, LocalizedString } from "../localization";

export const TextField: React.FC<FieldProps> = (props) => {
  const { field, onChange, onError } = props;
  const id = formFieldName(field);
  const [error, setError] = useState<LocaleKey | LocalizedString | null>(null);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    onChange();
    if (!isTouched) return;
    const value = (event.target as HTMLInputElement).value;
    validateField(value);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) validateField(value);
  }

  const validateField = useCallback(
    (value: string) => {
      const errorCode = validate(field, value) ?? null;
      if (onError) onError(id, errorCode);
      setError(errorCode);
      setIsTouched(true);
      return errorCode;
    },
    [field, id, onError],
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const listener = (e: Event) => {
      const value = (e as CustomEvent).detail.value;
      validateField(value);
    };
    input.addEventListener(InternalInputValidateEvent.type, listener);
    return () => {
      input.removeEventListener(InternalInputValidateEvent.type, listener);
    };
  }, [id, validateField]);

  return (
    <>
      <input
        id={id}
        name={id}
        ref={inputRef}
        type="text"
        placeholder={field.placeholder}
        className={`xendit-text-14 ${error ? "invalid" : ""}`}
        onBlur={handleBlur}
        onChange={handleChange}
        minLength={isTextField(field) ? field.type.min_length : undefined}
        maxLength={isTextField(field) ? field.type.max_length : undefined}
      />
    </>
  );
};

function isTextField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "text" };
} {
  return field.type.name === "text";
}
