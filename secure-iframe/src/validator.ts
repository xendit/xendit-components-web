import {
  CardBrand,
  IframeFieldType,
  IframeValidationError,
} from "../../shared/types";
import {
  validateCreditCardCVN,
  validateCreditCardExpiry,
  validateCreditCardNumber,
} from "./validation/card";
import { validatePostalCode, validateCountry } from "./validation/country";
import { validateEmail } from "./validation/email";
import { validatePhoneNumber } from "./validation/phone";
import { validateText } from "./validation/text";

export type ValidationResult = {
  empty: boolean;
  valid: boolean;
  errorCodes: IframeValidationError[];
  cardBrand?: CardBrand;
};

/**
 * Returns an array of validation errors.
 */
export function validate(
  inputType: IframeFieldType,
  value: string,
): ValidationResult {
  switch (inputType) {
    case "credit_card_number":
      return validateCreditCardNumber(value);
    case "credit_card_cvn":
      return validateCreditCardCVN(value);
    case "credit_card_expiry":
      return validateCreditCardExpiry(value);

    case "phone_number":
      return validatePhoneNumber(value);

    case "email":
      return validateEmail(value);

    case "postal_code":
      return validatePostalCode(value);

    case "country":
      return validateCountry(value);

    case "text":
      return validateText(value);

    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }
}
