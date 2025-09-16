import { useState } from "react";
import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";
import { validate } from "../validation";

export const TextField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  function validateField(value: string): void {
    const errorMessage = validate(field, value) ?? null;
    setError(errorMessage);
    setIsTouched(true);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    onChange();
    if (!isTouched) return;
    const value = (event.target as HTMLInputElement).value;
    validateField(value);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    validateField(value);
  }

  return (
    <>
      <input
        name={id}
        type="text"
        placeholder={field.placeholder}
        className="xendit-text-14"
        onBlur={handleBlur}
        onChange={handleChange}
        minLength={isTextField(field) ? field.type.min_length : undefined}
        maxLength={isTextField(field) ? field.type.max_length : undefined}
      />
      {error && <span className="xendit-error-message">{error}</span>}
    </>
  );
};

function isTextField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "text" };
} {
  return field.type.name === "text";
}
