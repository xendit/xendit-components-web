import { ChannelFormField } from "../backend-types/channel";
import { FieldProps } from "./field";
import { formFieldId, formFieldName } from "../utils";
import { useRef, useState } from "preact/hooks";
import { FunctionComponent, TargetedEvent, TargetedFocusEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const TextField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldId(field);
  const name = formFieldName(field);
  const inputRef = useRef<HTMLInputElement>(null);

  const [value, setValue] = useState(field.initial_value ?? "");

  function handleChange(event: TargetedEvent<HTMLInputElement>): void {
    setValue(event.currentTarget.value);
    onChange();
  }

  function handleBlur(event: TargetedFocusEvent<HTMLInputElement>): void {
    if (event.currentTarget?.value) {
      inputRef.current?.dispatchEvent(new InternalSetFieldTouchedEvent());
    }
  }

  return (
    <input
      id={id}
      name={name}
      ref={inputRef}
      placeholder={field.placeholder}
      className={`xendit-form-field-inner xendit-text-14`}
      value={value}
      onBlur={handleBlur}
      onChange={handleChange}
      {...inputAttributesFor(field)}
    />
  );
};

type TypeDerivedInputAttributes = {
  type: "text" | "email";
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
};

function inputAttributesFor(
  field: ChannelFormField,
): TypeDerivedInputAttributes {
  switch (field.type.name) {
    case "email":
      return { type: "email", autoComplete: "email" };
    case "postal_code":
      return { type: "text", autoComplete: "postal-code" };
    case "text":
      return {
        type: "text",
        minLength: field.type.min_length,
        maxLength: field.type.max_length,
        autoComplete: field.type.autocomplete,
      };
    default:
      return { type: "text" };
  }
}
