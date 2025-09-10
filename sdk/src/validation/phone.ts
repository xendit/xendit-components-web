import { CountryCode, isValidPhoneNumber } from "libphonenumber-js";
import { ValidationResult } from "./validator";
import { FormFieldValidationError } from "../../../shared/types";

export const validatePhoneNumber = (
  value: string,
  countryCode?: CountryCode | undefined,
): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  let errorCode: FormFieldValidationError | undefined;

  if (trimmedValue.length === 0) {
    return {
      errorCode: "PHONE_NUMBER_TOO_SHORT",
    };
  }

  // Check for non-numeric input
  if (!/^\d*$/.test(trimmedValue)) {
    return {
      errorCode: "NOT_A_NUMBER",
    };
  }

  const isValid = isValidPhoneNumber(trimmedValue, countryCode);

  if (!isValid) {
    errorCode = "INVALID_PHONE_NUMBER";
  }

  return {
    errorCode,
  };
};
