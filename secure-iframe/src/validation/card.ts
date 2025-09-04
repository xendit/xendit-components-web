import { CardBrand, IframeValidationError } from "../../../shared/types";
import { ValidationResult } from "../validator";

const CARD_BRANDS = [
  {
    name: "VISA",
    pattern: /^4\d{0,18}$/,
    validLengths: [13, 16, 19],
  },
  {
    name: "MASTERCARD",
    pattern: /^(5[1-5]\d{0,14}|2[2-7]\d{0,14})$/,
    validLengths: [16],
  },
  {
    name: "AMEX",
    pattern: /^3[47]\d{0,13}$/,
    validLengths: [15],
  },
  {
    name: "JCB",
    pattern: /^35\d{0,17}$/,
    validLengths: [16, 17, 18, 19],
  },
  {
    name: "DISCOVER",
    pattern:
      /^(6011\d{0,12}|65\d{0,14}|64[4-9]\d{0,13}|622(12[6-9]|1[3-9]\d|[2-8]\d{2}|9([01]\d|2[0-5]))\d{0,10})$/,
    validLengths: [16, 17, 18, 19],
  },
  {
    name: "DINERS",
    pattern: /^3(0[0-5]|[68]\d)\d{0,11}$/,
    validLengths: [14],
  },
  {
    name: "UNIONPAY",
    pattern: /^(62|88)\d{0,17}$/,
    validLengths: [16, 17, 18, 19],
  },
  {
    name: "UNKNOWN",
    pattern: /^\d+$/,
    validLengths: [12, 13, 14, 15, 16, 17, 18, 19],
  },
];

const detectCardBrand = (cardNumber: string): CardBrand | undefined => {
  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cardNumber)) {
    // Visa
    return "VISA";
  } else if (/^5[1-5][0-9]{14}$/.test(cardNumber)) {
    // MasterCard
    return "MASTERCARD";
  } else if (/^3[47][0-9]{13}$/.test(cardNumber)) {
    // American Express
    return "AMEX";
  } else if (/^35(2[89]|[3-8][0-9])[0-9]{12}$/.test(cardNumber)) {
    // JCB
    return "JCB";
  } else if (/^6(?:011|5[0-9]{2})[0-9]{12}$/.test(cardNumber)) {
    // Discover
    return "DISCOVER";
  } else if (/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/.test(cardNumber)) {
    // Diners Club
    return "DINERS";
  } else if (/^(62|88)[0-9]{14,17}$/.test(cardNumber)) {
    // UnionPay
    return "UNIONPAY";
  } else {
    return "UNKNOWN";
  }
};

export const validateCreditCardNumber = (value: string): ValidationResult => {
  const trimmedValue = value.replace(/\s+/g, "");
  const errorCodes: IframeValidationError[] = [];
  const cardBrand = detectCardBrand(trimmedValue);

  if (!/^\d*$/.test(trimmedValue)) {
    errorCodes.push("NOT_A_NUMBER");
  }

  if (!cardBrand && trimmedValue.length >= 6) {
    errorCodes.push("CREDIT_CARD_UNKNOWN_BRAND");
  }

  // Only validate length if brand is detected
  if (cardBrand) {
    const brandInfo = CARD_BRANDS.find((b) => b.name === cardBrand);
    if (brandInfo && !brandInfo.validLengths.includes(trimmedValue.length)) {
      if (trimmedValue.length < Math.min(...brandInfo.validLengths)) {
        errorCodes.push("CREDIT_CARD_NUMBER_TOO_SHORT");
      } else if (trimmedValue.length > Math.max(...brandInfo.validLengths)) {
        errorCodes.push("CREDIT_CARD_NUMBER_TOO_LONG");
      } else {
        errorCodes.push("CREDIT_CARD_NUMBER_INVALID_LENGTH");
      }
    }
  } else {
    // Generic length check if brand not detected
    if (trimmedValue.length < 12) {
      errorCodes.push("CREDIT_CARD_NUMBER_TOO_SHORT");
    }
    if (trimmedValue.length > 19) {
      errorCodes.push("CREDIT_CARD_NUMBER_TOO_LONG");
    }
  }

  // Luhn check only if length matches a valid brand length
  if (
    cardBrand &&
    CARD_BRANDS.find((b) => b.name === cardBrand)?.validLengths.includes(
      trimmedValue.length,
    )
  ) {
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
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    if (sum % 10 !== 0) {
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

export const validateCreditCardCVN = (value: string): ValidationResult => {
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

export const validateCreditCardExpiry = (value: string): ValidationResult => {
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
