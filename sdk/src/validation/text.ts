import { FormFieldValidationError } from "../../../shared/types";
import { ValidationResult } from "./validator";

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
