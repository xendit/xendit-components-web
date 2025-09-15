import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { FormFieldValidationError } from "../../shared/types";
import { ChannelFormField } from "./forms-types";

export type ValidationResult = {
  errorCode: FormFieldValidationError | undefined;
};

export const validateEmail = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;
  // Allows letters, numbers, dots, underscores, hyphens before the @
  // Domain must be letters, numbers, hyphens (no leading/trailing hyphen)
  // TLD must be at least 2 letters
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/;
  if (trimmedValue.length > 0 && !emailRegex.test(trimmedValue)) {
    errorCode = "INVALID_EMAIL_FORMAT";
  }
  return {
    errorCode,
  };
};

export const validatePhoneNumber = (
  value: string,
  countryCode?: CountryCode | undefined,
): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  let errorCode: FormFieldValidationError | undefined;

  const isValid = isValidPhoneNumber(trimmedValue, countryCode);

  if (!isValid) {
    errorCode = "INVALID_PHONE_NUMBER";
  }

  return {
    errorCode,
  };
};

export const validatePostalCode = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;

  // Basic validation: must be non-empty and contain only letters, numbers, spaces, or hyphens
  if (!/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(trimmedValue)) {
    errorCode = "INVALID_POSTAL_CODE";
  }

  return {
    errorCode,
  };
};

export const validateText = (
  input: ChannelFormField & {
    type: { name: "text" };
  },
  value: string,
): ValidationResult => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;

  if (Array.isArray(input.type.regex_validators)) {
    input.type.regex_validators.every((pattern) => {
      const regex = new RegExp(pattern.regex);
      if (!regex.test(value)) {
        return pattern.message;
      }
    });
  }

  if (trimmedValue.length < (input.type.min_length ?? 1)) {
    errorCode = "TEXT_TOO_SHORT";
  } else if (trimmedValue.length > input.type.max_length) {
    errorCode = "TEXT_TOO_LONG";
  }

  return {
    errorCode,
  };
};

export function validate(
  input: ChannelFormField,
  value: string,
): ValidationResult {
  if (input.required && value.trim().length === 0) {
    return { errorCode: "FIELD_IS_REQUIRED" };
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
