import { LocaleKey } from "../../sdk/src/localization";
import { CardBrand, IframeFieldType } from "../../shared/types";
import cardValidator from "card-validator";

export type ValidationResult = {
  empty: boolean;
  valid: boolean;
  errorCodes: LocaleKey[];
  cardBrand?: CardBrand;
};

export const validateCreditCardNumber = (value: string): ValidationResult => {
  const errorCodes: LocaleKey[] = [];

  // Check for non-numeric input
  if (!/^\d*$/.test(value)) {
    errorCodes.push({
      localeKey: "validation.card_number_invalid",
    });
  }

  const cardInfo = cardValidator.number(value);
  const cardBrand = cardInfo.card
    ? (cardInfo.card.type?.toUpperCase() as CardBrand)
    : undefined;

  // Brand detection
  if (!cardBrand && value.length >= 6) {
    // Unable to detect brand from IIN range
    errorCodes.push({
      localeKey: "validation.card_number_invalid",
    });
  }

  // Length validation
  if (cardBrand) {
    const validLengths = cardInfo.card?.lengths || [];
    if (!validLengths.includes(value.length)) {
      // Invalid length for detected brand
      errorCodes.push({
        localeKey: "validation.card_number_invalid",
      });
    }
  } else {
    if (value.length < 12 || value.length > 19) {
      // Too short or too long for any card brand
      errorCodes.push({
        localeKey: "validation.card_number_invalid",
      });
    }
  }

  // Luhn validation (only if length is valid for the brand)
  if (cardBrand && cardInfo.card?.lengths?.includes(value.length)) {
    if (!cardInfo.isValid) {
      // Luhn check failed
      errorCodes.push({
        localeKey: "validation.card_number_invalid",
      });
    }
  }

  return {
    empty: value.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
    cardBrand,
  };
};

export const validateCreditCardExpiry = (value: string): ValidationResult => {
  const errorCodes: LocaleKey[] = [];

  const MAX = 99;
  const expiryInfo = cardValidator.expirationDate(value, MAX);
  const { isPotentiallyValid, isValid, month, year } = expiryInfo;
  if (!isPotentiallyValid || month === null || year === null) {
    errorCodes.push({ localeKey: "validation.card_expiry_invalid" });
  }

  return {
    empty: value.length === 0,
    valid: isValid,
    errorCodes,
  };
};

export const validateCreditCardCVN = (value: string): ValidationResult => {
  const errorCodes: LocaleKey[] = [];
  const cvnInfo = cardValidator.cvv(value);

  if (!/^\d*$/.test(value)) {
    errorCodes.push({
      localeKey: "validation.card_cvn_invalid",
    });
  } else {
    if (!cvnInfo.isPotentiallyValid && value.length > 0) {
      if (value.length < 3) {
        errorCodes.push({
          localeKey: "validation.text_too_short",
        });
      } else if (value.length > 4) {
        errorCodes.push({
          localeKey: "validation.text_too_long",
        });
      }
    } else if (!cvnInfo.isValid && value.length > 0) {
      if (value.length < 3) {
        errorCodes.push({
          localeKey: "validation.text_too_short",
        });
      } else if (value.length > 4) {
        errorCodes.push({
          localeKey: "validation.text_too_long",
        });
      }
    }
  }

  return {
    empty: value.length === 0,
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
