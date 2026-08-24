import {
  BffChannel,
  ChannelFormField,
  ChannelProperties,
  ChannelPropertyPrimative,
} from "./backend-types/channel";
import parsePhoneNumberFromString from "libphonenumber-js/min";
import { filterFormFields } from "./components/channel-form";
import { BffSessionType } from "./backend-types/session";
import { LocaleKey, LocalizedString } from "./localization";
import { ChannelComponentData } from "./public-sdk";
import { parseEncryptedFieldValue } from "./utils";
import { CustomerDetails } from "./backend-types/customer";

export type ValidationResult = {
  errorCode: LocaleKey | LocalizedString | undefined;
};

export function validateEncryptedCardField(
  value: string,
): LocaleKey | undefined {
  const parsed = parseEncryptedFieldValue(value);
  if (parsed.valid) {
    return undefined;
  }
  if (parsed.validationError) {
    return { localeKey: parsed.validationError as LocaleKey["localeKey"] };
  }
  // unreachable
  throw new Error(
    "Unexpected value in encrypted field, this is a bug, please contact support.",
  );
}

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

export function validatePlaintextCardNumber(
  value: string,
): LocaleKey | undefined {
  // strip spaces from formatted value
  value = value.replace(/\s/g, "");

  if (!/^\d*$/.test(value)) {
    return { localeKey: "validation.card_number_invalid" };
  }
  if (value.length < 12 || value.length > 19) {
    return { localeKey: "validation.card_number_invalid" };
  }
  if (!luhnCheck(value)) {
    return { localeKey: "validation.card_number_invalid" };
  }
  return undefined;
}

export function validatePlaintextCardExpiry(
  value: string,
): LocaleKey | undefined {
  // value is a JSON array ["MM", "YY"]
  let month: number;
  let yearStr: string;
  try {
    const parts = JSON.parse(value) as string[];
    if (!Array.isArray(parts) || parts.length !== 2) {
      return { localeKey: "validation.card_expiry_invalid" };
    }
    month = parseInt(parts[0], 10);
    yearStr = parts[1];
  } catch {
    return { localeKey: "validation.card_expiry_invalid" };
  }

  const year =
    yearStr.length === 2 ? 2000 + parseInt(yearStr, 10) : parseInt(yearStr, 10);

  const isValidMonth = month >= 1 && month <= 12;
  const isValidYear = year >= 2000 && year <= 2099;

  if (!isValidMonth || !isValidYear) {
    return { localeKey: "validation.card_expiry_invalid" };
  }

  const now = new Date();
  const expiry = new Date(year, month - 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth());
  if (expiry < currentMonth) {
    return { localeKey: "validation.card_expiry_invalid" };
  }

  return undefined;
}

export function validatePlaintextCardCvn(value: string): LocaleKey | undefined {
  if (!/^\d*$/.test(value)) {
    return { localeKey: "validation.card_cvn_invalid" };
  }
  if (value.length < 3) {
    return { localeKey: "validation.text_too_short" };
  }
  if (value.length > 4) {
    return { localeKey: "validation.text_too_long" };
  }
  return undefined;
}

/**
 * Returns true if the value looks like an encrypted field (xendit-encrypted-...).
 * Used to determine which validation path to take for card fields.
 */
function isEncryptedFieldValue(value: string): boolean {
  return value.startsWith("xendit-encrypted-");
}

export const validateEmail = (value: string): LocaleKey | undefined => {
  // Allows letters, numbers, dots, underscores, hyphens before the @
  // Domain must be letters, numbers, hyphens (no leading/trailing hyphen)
  // TLD must be at least 2 letters
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(value)) {
    return {
      localeKey: "validation.generic_invalid",
    };
  }
};

export const validatePhoneNumber = (value: string): LocaleKey | undefined => {
  const phone = parsePhoneNumberFromString(value);
  if (!phone || !phone.isValid()) {
    return {
      localeKey: "validation.generic_invalid",
    };
  }
};

export const validatePostalCode = (value: string): LocaleKey | undefined => {
  // Basic validation: must contain only letters, numbers, spaces, or hyphens
  if (!/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(value)) {
    return {
      localeKey: "validation.generic_invalid",
    };
  }
};

export const validateText = (
  input: ChannelFormField & {
    type: { name: "text" };
  },
  value: string,
): LocaleKey | LocalizedString | undefined => {
  if (Array.isArray(input.type.regex_validators)) {
    for (const pattern of input.type.regex_validators) {
      const regex = new RegExp(sanitizeRegex(pattern.regex));
      if (!regex.test(value)) {
        return {
          value: pattern.message,
        };
      }
    }
  }

  if (
    input.type.min_length !== undefined &&
    value.length < input.type.min_length
  ) {
    return { localeKey: "validation.text_too_short" };
  } else if (value.length > input.type.max_length) {
    return { localeKey: "validation.text_too_long" };
  }
};

function sanitizeRegex(pattern: string): string {
  // Remove leading and trailing slashes if present
  if (pattern.startsWith("/") && pattern.endsWith("/")) {
    return pattern.slice(1, -1);
  }
  return pattern;
}

export function validate(
  input: ChannelFormField,
  value: string,
): LocaleKey | LocalizedString | undefined {
  if (value.length === 0) {
    if (input.required) {
      return { localeKey: "validation.required" };
    } else {
      // ok, empty string and not required
      return undefined;
    }
  }

  switch (input.type.name) {
    case "credit_card_number":
    case "credit_card_expiry":
    case "credit_card_cvn": {
      if (isEncryptedFieldValue(value)) {
        return validateEncryptedCardField(value);
      }
      // Plaintext card field (no publicKey/signature available)
      switch (input.type.name) {
        case "credit_card_number":
          return validatePlaintextCardNumber(value);
        case "credit_card_expiry":
          return undefined;
        case "credit_card_cvn":
          return validatePlaintextCardCvn(value);
      }
      break;
    }
    case "phone_number":
      return validatePhoneNumber(value);
    case "email":
      return validateEmail(value);
    case "postal_code":
      return validatePostalCode(value);
    case "text": {
      return validateText(
        input as ChannelFormField & {
          type: { name: "text" };
        },
        value,
      );
    }
    case "country":
    case "province":
    case "installment_plan":
    case "dropdown": {
      // no validation required for now
      return undefined;
    }

    default: {
      input.type satisfies never;
      throw new Error(
        `Unsupported input type: ${(input as ChannelFormField).type.name}; this is a bug, please contact support.`,
      );
    }
  }
}

export function channelPropertiesAreValid(
  sessionType: BffSessionType,
  channel: BffChannel,
  channelProperties: ChannelProperties | null,
  channelComponentData: ChannelComponentData | null,
): boolean {
  if (!channelProperties) channelProperties = {};

  for (const field of filterFormFields(
    sessionType,
    channel.form,
    channelProperties,
    channelComponentData,
  )) {
    if (channelPropertyFieldValidate(field, channelProperties)) {
      return false;
    }
  }

  const allowedBrands = channel.card?.brands;
  const schemes = channelComponentData?.cardDetails?.details?.schemes;
  if (allowedBrands?.length && schemes?.length) {
    const allowedNames = allowedBrands.map((b) => b.name);
    if (!schemes.some((s) => allowedNames.includes(s))) {
      return false;
    }
  }

  return true;
}

// Return a validation error message if the channel property is invalid
export function channelPropertyFieldValidate(
  field: ChannelFormField,
  channelProperties: ChannelProperties,
) {
  if (field.type.name === "credit_card_expiry") {
    const month = getChannelPropertyValue(
      channelProperties,
      field.channel_property[0],
    );
    const year = getChannelPropertyValue(
      channelProperties,
      field.channel_property[1],
    );

    // special validation for unencrypted credit card expiry
    if (
      !isEncryptedFieldValue(month as string) &&
      !isEncryptedFieldValue(year as string)
    ) {
      const value = JSON.stringify([month, year]);
      const error = validatePlaintextCardExpiry(value);
      if (error) {
        return error;
      }
    }
  }

  const channelPropertyKeys = Array.isArray(field.channel_property)
    ? field.channel_property
    : [field.channel_property];
  for (const key of channelPropertyKeys) {
    let value = getChannelPropertyValue(channelProperties, key);
    if (value === undefined) {
      value = "";
    }
    if (typeof value !== "string") {
      // validation for non-string values not supported
      continue;
    }
    const error = validate(field, value);
    if (error) {
      return error;
    }
  }
}

export function validateCustomerDetails(
  customerDetails: CustomerDetails,
): LocaleKey | LocalizedString | undefined {
  if (customerDetails.given_names.length === 0) {
    return { localeKey: "validation.required" };
  }
}

export function getChannelPropertyValue(
  channelProperties: ChannelProperties,
  key: string,
): ChannelPropertyPrimative | ChannelPropertyPrimative[] | undefined {
  const parts = key.split(".");
  const wantsArray = parts[0].endsWith("[]");
  if (wantsArray) {
    if (parts.length !== 1) {
      throw new Error("Array channel properties cannot have nested keys");
    }
    parts[0] = parts[0].slice(0, -2);
  }
  const value = channelProperties[parts[0]];
  if (value === undefined) {
    return undefined;
  }
  if (wantsArray && Array.isArray(value)) {
    return value;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    if (parts.length !== 1) {
      throw new Error(
        `Attempted to read channel property "${key}" expecting an object but found a primitive value; this is a bug, please contact support.`,
      );
    }
    return value;
  } else {
    return getChannelPropertyValue(value, parts.slice(1).join("."));
  }
}
