import { IframeValidationError } from "../shared/types";
import { ValidationResult } from "./validator";
import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";

export const validatePhoneNumber = (
  value: string,
  countryCode?: CountryCode | undefined,
): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];

  if (trimmedValue.length === 0) {
    return {
      empty: true,
      valid: true,
      errorCodes,
    };
  }

  // Check if the number is valid (default region can be 'ID' or as needed)
  let isValid = false;
  try {
    isValid = isValidPhoneNumber(trimmedValue, countryCode || "ID");
  } catch {
    errorCodes.push("NOT_A_NUMBER");
  }

  if (!isValid) {
    errorCodes.push("INVALID_PHONE_NUMBER");
  }

  return {
    empty: false,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};
