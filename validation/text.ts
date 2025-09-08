import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";

export const validateText = (value: string): ValidationResult => {
  const trimmedValue = value.trim();
  const errorCodes: IframeValidationError[] = [];
  // Basic validation: non-empty
  if (trimmedValue.length === 0) {
    errorCodes.push("TEXT_TOO_SHORT");
  }

  // TODO: Validate against a list of to be defined requirements

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
