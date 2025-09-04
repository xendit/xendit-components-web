import { IframeValidationError } from "../../../shared/types";
import { ValidationResult } from "../validator";

export const validateCountry = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Basic validation: must be 2-letter country code
  if (!/^[A-Z]{2}$/.test(trimmedValue)) {
    errorCodes.push("INVALID_COUNTRY");
  }
  // TODO: Validate using a list of country codes (json?)

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};

export const validatePostalCode = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Basic validation: non-empty
  if (trimmedValue.length === 0) {
    errorCodes.push("INVALID_POSTAL_CODE");
  }
  // TODO: Validate using https://www.npmjs.com/package/postcode-validator
  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
