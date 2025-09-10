import { FormFieldValidationError } from "../../../shared/types";

export const validateCountry = (value: string) => {
  const trimmedValue = value.trim();
  let errorCode: FormFieldValidationError | undefined;
  // Basic validation: must be 2-letter country code
  if (!/^[A-Z]{2}$/.test(trimmedValue)) {
    errorCode = "INVALID_COUNTRY";
  }

  return {
    errorCode,
  };
};
