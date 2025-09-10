import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { FormFieldType, FormFieldValidationError } from "../../shared/types";

export type ValidationResult = {
  errorCode: FormFieldValidationError | undefined;
};

export const validateCountry = (value: string) => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;
  // Basic validation: must be 2-letter country code
  if (!/^[A-Z]{2}$/.test(trimmedValue)) {
    errorCode = "INVALID_COUNTRY";
  }

  return {
    errorCode,
  };
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

  if (trimmedValue.length === 0) {
    return {
      errorCode: "FIELD_REQUIRED",
    };
  }

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
  if (trimmedValue.length === 0) {
    errorCode = "FIELD_REQUIRED";
  } else if (!/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(trimmedValue)) {
    errorCode = "INVALID_POSTAL_CODE";
  }

  return {
    errorCode,
  };
};

export const validateText = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;
  // Basic validation: non-empty
  if (trimmedValue.length === 0) {
    errorCode = "TEXT_TOO_SHORT";
  } else if (trimmedValue.length > 255) {
    // Arbitrary max length
    errorCode = "TEXT_TOO_LONG";
  }

  return {
    errorCode,
  };
};

export function validate(
  inputType: FormFieldType,
  value: string,
): ValidationResult {
  switch (inputType) {
    case "country":
      return validateCountry(value);
    case "phone_number":
      return validatePhoneNumber(value);
    case "email":
      return validateEmail(value);
    case "postal_code":
      return validatePostalCode(value);
    case "text":
      return validateText(value);

    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }
}
