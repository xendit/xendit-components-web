import { useState } from "react";
import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";
import { validate } from "../validation";

export const TextField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);
  const [error, setError] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState(false);

  if (!isSupportedField(field)) {
    throw new Error(`Field type '${field.type.name}' not supported!`);
  }

  function validateField(value: string): void {
    const errorMessage = validate(field, value).errorCode?.toString() ?? "";
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
        minLength={
          field.type.name === "text" ? field.type.min_length : undefined
        }
        maxLength={
          field.type.name === "text" ? field.type.max_length : undefined
        }
      />
      {error && <span className="xendit-error-message">{error}</span>}
    </>
  );
};

function isSupportedField(field: ChannelFormField): field is ChannelFormField &
  (
    | {
        type: { name: "text" };
      }
    | {
        type: { name: "phone_number" };
      }
    | {
        type: { name: "email" };
      }
    | {
        type: { name: "postal_code" };
      }
  ) {
  return ["text", "phone_number", "email", "postal_code"].includes(
    field.type.name,
  );
}
