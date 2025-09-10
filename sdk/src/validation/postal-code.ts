import { FormFieldValidationError } from "../../../shared/types";
import { ValidationResult } from "./validator";

export const validatePostalCode = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;

  // Basic validation: must be non-empty and contain only letters, numbers, spaces, or hyphens
  if (
    trimmedValue.length === 0 ||
    !/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(trimmedValue)
  ) {
    errorCode = "INVALID_POSTAL_CODE";
  }

  return {
    errorCode,
  };
};
