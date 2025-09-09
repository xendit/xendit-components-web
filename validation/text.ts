import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";

export const validateText = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Basic validation: non-empty
  if (trimmedValue.length === 0) {
    errorCodes.push("TEXT_TOO_SHORT");
  }

  if (trimmedValue.length > 255) {
    // Arbitrary max length
    errorCodes.push("TEXT_TOO_LONG");
  }

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
