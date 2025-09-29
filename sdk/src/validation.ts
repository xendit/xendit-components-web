import { FormFieldValidationError } from "../../shared/types";
import { ChannelFormField } from "./forms-types";
import parsePhoneNumberFromString from "libphonenumber-js/min";

export type ValidationResult = {
  errorCode: FormFieldValidationError | undefined;
};

export const validateEmail = (
  value: string,
): FormFieldValidationError | undefined => {
  const trimmedValue = value.trim();
  // Allows letters, numbers, dots, underscores, hyphens before the @
  // Domain must be letters, numbers, hyphens (no leading/trailing hyphen)
  // TLD must be at least 2 letters
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/;

  if (trimmedValue.length > 0 && !emailRegex.test(trimmedValue))
    return "INVALID_EMAIL_FORMAT";
};

export const validatePhoneNumber = (
  value: string,
): FormFieldValidationError | undefined => {
  const input = value?.trim();
  if (!input) return "INVALID_PHONE_NUMBER";

  const phone = parsePhoneNumberFromString(input);
  if (!phone) return "INVALID_PHONE_NUMBER";

  return phone.isValid() ? undefined : "INVALID_PHONE_NUMBER";
};

export const validatePostalCode = (
  value: string,
): FormFieldValidationError | undefined => {
  const trimmedValue = value.trim();

  // Basic validation: must be non-empty and contain only letters, numbers, spaces, or hyphens
  if (!/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(trimmedValue)) {
    return "INVALID_POSTAL_CODE";
  }
};

export const validateText = (
  input: ChannelFormField & {
    type: { name: "text" };
  },
  value: string,
): FormFieldValidationError | undefined => {
  const trimmedValue = value.trim();

  if (Array.isArray(input.type.regex_validators)) {
    input.type.regex_validators.every((pattern) => {
      const regex = new RegExp(pattern.regex);
      if (!regex.test(value)) {
        return pattern.message;
      }
    });
  }

  if (trimmedValue.length < (input.type.min_length ?? 1)) {
    return "TEXT_TOO_SHORT";
  } else if (trimmedValue.length > input.type.max_length) {
    return "TEXT_TOO_LONG";
  }
};

export function validate(
  input: ChannelFormField,
  value: string,
): FormFieldValidationError | undefined {
  console.log(input.required, value);
  if (input.required && value.trim().length === 0) {
    return "FIELD_IS_REQUIRED";
  }

  switch (input.type.name) {
    case "phone_number":
      return validatePhoneNumber(value);
    case "email":
      return validateEmail(value);
    case "postal_code":
      return validatePostalCode(value);
    case "text":
      return validateText(
        input as ChannelFormField & {
          type: { name: "text" };
        },
        value,
      );

    default:
      throw new Error(`Unsupported input type: ${input.type.name}`);
  }
}
