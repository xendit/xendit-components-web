import { ChannelFormField } from "../backend-types/channel";
import { FieldProps } from "./field";
import { validate } from "../validation";
import { InternalInputValidateEvent } from "../private-event-types";
import { formFieldName } from "../utils";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { FunctionComponent, TargetedEvent, TargetedFocusEvent } from "preact";

export const TextField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange, onError } = props;
  const id = formFieldName(field);
  const [isTouched, setIsTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: TargetedEvent<HTMLInputElement>): void {
    onChange();
    if (!isTouched) return;
    const value = (event.target as HTMLInputElement).value;
    validateField(value);
  }

  function handleBlur(event: TargetedFocusEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) validateField(value);
  }

  const validateField = useCallback(
    (value: string) => {
      const errorCode = validate(field, value) ?? null;
      if (onError) onError(id, errorCode);
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
        className={`xendit-text-14`}
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
