import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";

export const validateEmail = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (trimmedValue.length > 0 && !emailRegex.test(trimmedValue)) {
    errorCodes.push("INVALID_EMAIL_FORMAT");
  }
  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
