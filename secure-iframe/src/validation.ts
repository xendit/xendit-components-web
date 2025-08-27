import {
  CardBrand,
  IframeFieldType,
  IframeValidationError,
} from "../../shared/shared";

export type ValidationResult = {
  empty: boolean;
  valid: boolean;
  errorCodes: IframeValidationError[];
  cardBrand?: CardBrand;
};

const validateCreditCardNumber = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];
  const cardBrand: CardBrand | undefined = (() => {
    if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(trimmedValue)) {
      return "VISA";
    } else if (/^5[1-5][0-9]{14}$/.test(trimmedValue)) {
      // MasterCard
      return "MASTERCARD";
    }
  })();
  if (trimmedValue.length < 12) {
    errorCodes.push("CREDIT_CARD_NUMBER_TOO_SHORT");
  }
  if (trimmedValue.length > 19) {
    errorCodes.push("CREDIT_CARD_NUMBER_TOO_LONG");
  } else {
    // Luhn check
    let sum = 0;
    let shouldDouble = false;
    for (let i = trimmedValue.length - 1; i >= 0; i--) {
      let digit = parseInt(trimmedValue.charAt(i), 10);
      if (isNaN(digit)) {
        errorCodes.push("NOT_A_NUMBER");
        break;
      }
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    if (errorCodes.length === 0 && sum % 10 !== 0) {
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

const validateCreditCardCVN = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];
  if (!/^\d+$/.test(trimmedValue)) {
    errorCodes.push("NOT_A_NUMBER");
  }
  if (trimmedValue.length < 3) {
    errorCodes.push("CREDIT_CARD_CVN_TOO_SHORT");
  }
  if (trimmedValue.length > 4) {
    errorCodes.push("CREDIT_CARD_CVN_TOO_LONG");
  }
  return {
    empty: trimmedValue.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};

const validateCreditCardExpiry = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];
  if (!/^\d{2}\/\d{2}$/.test(trimmedValue)) {
    errorCodes.push("CREDIT_CARD_EXPIRY_INVALID_FORMAT");
  } else {
    const [monthStr, yearStr] = trimmedValue.split("/");
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      errorCodes.push("CREDIT_CARD_EXPIRY_INVALID_DATE");
    } else {
      // Assume current century for 2-digit year
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1; // zero-based
      if (
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        errorCodes.push("CREDIT_CARD_EXPIRY_IN_PAST");
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
  console.log("Validating", inputType, value);
  switch (inputType) {
    case "credit_card_number": {
      return validateCreditCardNumber(value);
    }
    case "credit_card_cvn":
      return validateCreditCardCVN(value);

    case "credit_card_expiry":
      return validateCreditCardExpiry(value);
    default:
      return {
        empty: value.length === 0,
        valid: true,
        errorCodes: [],
      };
  }
}
