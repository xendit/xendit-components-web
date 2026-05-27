import { LocaleKey } from "../../sdk/src/localization";
import { IframeFieldType } from "../../shared/types";

function luhnCheck(value: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let n = parseInt(value[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export type ValidationResult = {
  empty: boolean;
  valid: boolean;
  errorCodes: LocaleKey[];
};

export const validateCreditCardNumber = (value: string): ValidationResult => {
  // remove whitespace - validation library does not allow it but our backend does
  value = value.replace(/\s+/g, "");

  const errorCodes: LocaleKey[] = [];

  if (!/^\d*$/.test(value)) {
    // non-numeric input
    errorCodes.push({ localeKey: "validation.card_number_invalid" });
  } else if (value.length < 12 || value.length > 19) {
    // too short or too long for any card brand
    errorCodes.push({ localeKey: "validation.card_number_invalid" });
  } else if (!luhnCheck(value)) {
    // Luhn check failed
    errorCodes.push({ localeKey: "validation.card_number_invalid" });
  }

  return {
    empty: value.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};

export const validateCreditCardExpiry = (value: string): ValidationResult => {
  const errorCodes: LocaleKey[] = [];

  // MM/YY or MM/YYYY format
  const parts = value.split("/");
  const month = parseInt(parts[0] ?? "", 10);
  const yearStr = (parts[1] ?? "").trim();
  const year =
    yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);

  const isValidMonth = month >= 1 && month <= 12;
  const isValidYear = year >= 2000 && year <= 2099;

  if (!isValidMonth || !isValidYear || parts.length !== 2) {
    errorCodes.push({ localeKey: "validation.card_expiry_invalid" });
  } else {
    const now = new Date();
    const expiry = new Date(year, month - 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth());
    if (expiry < currentMonth) {
      errorCodes.push({ localeKey: "validation.card_expiry_invalid" });
    }
  }

  return {
    empty: value.length === 0,
    valid: errorCodes.length === 0,
    errorCodes,
  };
};

export const validateCreditCardCVN = (value: string): ValidationResult => {
  const errorCodes: LocaleKey[] = [];

  if (!/^\d*$/.test(value)) {
    errorCodes.push({
      localeKey: "validation.card_cvn_invalid",
    });
  } else if (value.length < 3) {
    errorCodes.push({
      localeKey: "validation.text_too_short",
    });
  } else if (value.length > 4) {
    errorCodes.push({
      localeKey: "validation.text_too_long",
    });
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
