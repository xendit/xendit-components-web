import { useState } from "react";
import { ChannelFormField } from "../forms-types";
import { FieldProps, formFieldName } from "./field";

export const TextField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;
  const id = formFieldName(field);
  const [errors, setErrors] = useState<string[] | null>(null);

  if (!isTextField(field)) {
    throw new Error("TextField expects field.type.name to be 'text'");
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    const errorMessages: string[] = [];

    if (Array.isArray(field.type.regex_validators)) {
      field.type.regex_validators.every((pattern) => {
        const regex = new RegExp(pattern.regex);
        if (!regex.test(value)) {
          errorMessages.push(pattern.message);
        }
        return regex.test(value);
      });
    }

    setErrors(errorMessages);
    onChange();
  };

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
