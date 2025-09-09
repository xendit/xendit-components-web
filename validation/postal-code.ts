import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";

export const validatePostalCode = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];

  // Basic validation: must be non-empty and contain only letters, numbers, spaces, or hyphens
  if (
    trimmedValue.length === 0 ||
    !/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(trimmedValue)
  ) {
    errorCodes.push("INVALID_POSTAL_CODE");
  }

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
