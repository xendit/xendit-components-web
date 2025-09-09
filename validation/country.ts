import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";

export const validateCountry = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Basic validation: must be 2-letter country code
  if (!/^[A-Z]{2}$/.test(trimmedValue)) {
    errorCodes.push("INVALID_COUNTRY");
  }

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
