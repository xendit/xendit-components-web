import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";

export const validateEmail = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Allows letters, numbers, dots, underscores, hyphens before the @
  // Domain must be letters, numbers, hyphens (no leading/trailing hyphen)
  // TLD must be at least 2 letters
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/;
  if (trimmedValue.length > 0 && !emailRegex.test(trimmedValue)) {
    errorCodes.push("INVALID_EMAIL_FORMAT");
  }
  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
