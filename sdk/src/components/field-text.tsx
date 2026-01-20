import { ChannelFormField } from "../backend-types/channel";
import { FieldProps } from "./field";
import { formFieldName } from "../utils";
import { useRef } from "preact/hooks";
import { FunctionComponent, TargetedEvent, TargetedFocusEvent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";

export const TextField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: TargetedEvent<HTMLInputElement>): void {
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
  );
};

function isTextField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "text" };
} {
  return field.type.name === "text";
}
