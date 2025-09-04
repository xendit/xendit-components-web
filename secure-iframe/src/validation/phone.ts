import { IframeValidationError } from "../../../shared/types";
import { ValidationResult } from "../validator";

export const validatePhoneNumber = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];
  // Very basic validation: must be digits and between 7 and 15 characters
  if (!/^\d+$/.test(trimmedValue)) {
    errorCodes.push("NOT_A_NUMBER");
  }
  // TODO: Validate using https://www.npmjs.com/package/libphonenumber-js

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
