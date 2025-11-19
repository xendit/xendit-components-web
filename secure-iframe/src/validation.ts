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
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: LocaleKey[] = [];

  // Check for non-numeric input
  if (!/^\d*$/.test(trimmedValue)) {
    errorCodes.push({
      localeKey: "validation.card_number_invalid",
    });
  }

  const cardInfo = cardValidator.number(trimmedValue);
  const cardBrand = cardInfo.card
    ? (cardInfo.card.type?.toUpperCase() as CardBrand)
    : undefined;

  // Brand detection
  if (!cardBrand && trimmedValue.length >= 6) {
    // Unable to detect brand from IIN range
    errorCodes.push({
      localeKey: "validation.card_number_invalid",
    });
  }

  // Length validation
  if (cardBrand) {
    const validLengths = cardInfo.card?.lengths || [];
    if (!validLengths.includes(trimmedValue.length)) {
      // Invalid length for detected brand
      errorCodes.push({
        localeKey: "validation.card_number_invalid",
      });
    }
  } else {
    if (trimmedValue.length < 12 || trimmedValue.length > 19) {
      // Too short or too long for any card brand
      errorCodes.push({
        localeKey: "validation.card_number_invalid",
      });
    }
  }

  // Luhn validation (only if length is valid for the brand)
  if (cardBrand && cardInfo.card?.lengths?.includes(trimmedValue.length)) {
    if (!cardInfo.isValid) {
      // Luhn check failed
      errorCodes.push({
        localeKey: "validation.card_number_invalid",
      });
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
  const errorCodes: LocaleKey[] = [];

  const expiryInfo = cardValidator.expirationDate(trimmedValue);
  const { isPotentiallyValid, isValid, month, year } = expiryInfo;
  if (!isPotentiallyValid || month === null || year === null) {
    errorCodes.push({ localeKey: "validation.card_expiry_invalid" });
  }

  return {
    empty: trimmedValue.length === 0,
    valid: isValid,
    errorCodes,
  };
};

export const validateCreditCardCVN = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: LocaleKey[] = [];
  const cvnInfo = cardValidator.cvv(trimmedValue);

  if (!/^\d*$/.test(trimmedValue)) {
    errorCodes.push({
      localeKey: "validation.card_cvn_invalid",
    });
  } else {
    if (!cvnInfo.isPotentiallyValid && trimmedValue.length > 0) {
      if (trimmedValue.length < 3) {
        errorCodes.push({
          localeKey: "validation.text_too_short",
        });
      } else if (trimmedValue.length > 4) {
        errorCodes.push({
          localeKey: "validation.text_too_long",
        });
      }
    } else if (!cvnInfo.isValid && trimmedValue.length > 0) {
      if (trimmedValue.length < 3) {
        errorCodes.push({
          localeKey: "validation.text_too_short",
        });
      } else if (trimmedValue.length > 4) {
        errorCodes.push({
          localeKey: "validation.text_too_long",
        });
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
