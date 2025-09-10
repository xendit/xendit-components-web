import { FormFieldType, FormFieldValidationError } from "../../../shared/types";
import { validateCountry } from "./country";
import { validateEmail } from "./email";
import { validatePhoneNumber } from "./phone";
import { validatePostalCode } from "./postal-code";
import { validateText } from "./text";

export type ValidationResult = {
  errorCode: FormFieldValidationError | undefined;
};

export function validate(
  inputType: FormFieldType,
  value: string,
): ValidationResult {
  switch (inputType) {
    case "country":
      return validateCountry(value);
    case "phone_number":
      return validatePhoneNumber(value);
    case "email":
      return validateEmail(value);
    case "postal_code":
      return validatePostalCode(value);
    case "text":
      return validateText(value);

    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }
}
