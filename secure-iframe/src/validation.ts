import {
  CardBrand,
  IframeFieldType,
  IframeValidationError,
} from "../../shared/types";
import cardValidator from "card-validator";

export type ValidationResult = {
  empty: boolean;
  valid: boolean;
  errorCodes: IframeValidationError[];
  cardBrand?: CardBrand;
};

export const validateCreditCardNumber = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];

  // Check for non-numeric input
  if (!/^\d*$/.test(trimmedValue)) {
    errorCodes.push("NOT_A_NUMBER");
  }

  const cardInfo = cardValidator.number(trimmedValue);
  const cardBrand = cardInfo.card
    ? (cardInfo.card.type?.toUpperCase() as CardBrand)
    : undefined;

  // Brand detection
  if (!cardBrand && trimmedValue.length >= 6) {
    errorCodes.push("CREDIT_CARD_UNKNOWN_BRAND");
  }

  // Length validation
  if (cardBrand) {
    const validLengths = cardInfo.card?.lengths || [];
    if (!validLengths.includes(trimmedValue.length)) {
      errorCodes.push("CREDIT_CARD_NUMBER_INVALID_LENGTH");
    }
  } else {
    if (trimmedValue.length < 12 || trimmedValue.length > 19) {
      errorCodes.push("CREDIT_CARD_NUMBER_INVALID_LENGTH");
    }
  }

  // Luhn validation (only if length is valid for the brand)
  if (cardBrand && cardInfo.card?.lengths?.includes(trimmedValue.length)) {
    if (!cardInfo.isValid) {
      errorCodes.push("CREDIT_CARD_NUMBER_LUHN");
    }
  }

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
    cardBrand,
  };
};

export const validateCreditCardExpiry = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];

  const expiryInfo = cardValidator.expirationDate(trimmedValue);
  const { isPotentiallyValid, isValid, month, year } = expiryInfo;
  if (!isPotentiallyValid || month === null || year === null) {
    errorCodes.push("CREDIT_CARD_EXPIRY_INVALID");
  }

  return {
    empty: trimmedValue.length === 0,
    valid: isValid,
    errorCodes,
  };
};

export const validateCreditCardCVN = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];
  const cvnInfo = cardValidator.cvv(trimmedValue);

  if (!/^\d+$/.test(trimmedValue)) {
    errorCodes.push("NOT_A_NUMBER");
  } else {
    if (!cvnInfo.isPotentiallyValid && trimmedValue.length > 0) {
      if (trimmedValue.length < 3) {
        errorCodes.push("CREDIT_CARD_CVN_TOO_SHORT");
      } else if (trimmedValue.length > 4) {
        errorCodes.push("CREDIT_CARD_CVN_TOO_LONG");
      }
    } else if (!cvnInfo.isValid && trimmedValue.length > 0) {
      if (trimmedValue.length < 3) {
        errorCodes.push("CREDIT_CARD_CVN_TOO_SHORT");
      } else if (trimmedValue.length > 4) {
        errorCodes.push("CREDIT_CARD_CVN_TOO_LONG");
      }
    }
  }

  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
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
    case "credit_card_expiry":
      return validateCreditCardExpiry(value);
    case "credit_card_cvn":
      return validateCreditCardCVN(value);

    default:
      throw new Error(`Unsupported input type: ${inputType}`);
  }
}
