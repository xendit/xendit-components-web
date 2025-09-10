import { useState } from "react";
import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";
import {
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
  validateText,
} from "../validation";

export const TextField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);
  const [errors, setErrors] = useState<string[] | null>(null);

  if (!isTextField(field)) {
    throw new Error("TextField expects field.type.name to be 'text'");
  }

  function validateTextField(value: string): void {
    const errorMessages: string[] = [];

    switch (field.type.name) {
      case "phone_number":
        errorMessages.push(validatePhoneNumber(value).errorCode ?? "");
        break;
      case "email":
        errorMessages.push(validateEmail(value).errorCode ?? "");
        break;
      case "postal_code":
        errorMessages.push(validatePostalCode(value).errorCode ?? "");
        break;
      case "text":
        if (Array.isArray(field.type.regex_validators)) {
          field.type.regex_validators.every((pattern) => {
            const regex = new RegExp(pattern.regex);
            if (!regex.test(value)) {
              errorMessages.push(pattern.message);
            }
            return regex.test(value);
          });
        }
        errorMessages.push(validateText(value).errorCode ?? "");
        break;
      default:
        break;
    }

    setErrors(errorMessages);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    validateTextField(value);
    onChange();
  }

  return (
    <>
      <input
        name={id}
        type="text"
        placeholder={field.placeholder}
        className="xendit-text-14"
        onChange={handleChange}
        minLength={isTextField(field) ? field.type.min_length : undefined}
        maxLength={isTextField(field) ? field.type.max_length : undefined}
        required={field.required}
      />
      {errors &&
        errors.map((error, index) => (
          <span key={index} className="xendit-error-message">
            {error}
          </span>
        ))}
    </>
  );
};

function isTextField(field: ChannelFormField): field is ChannelFormField & {
  type: { name: "text" };
} {
  return ["text", "phone_number", "email", "postal_code"].includes(
    field.type.name,
  );
}
