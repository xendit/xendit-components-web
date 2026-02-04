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

export type ValidationResult = {
  errorCode: LocaleKey | LocalizedString | undefined;
};

export function validateEncryptedCardField(
  value: string,
): LocaleKey | undefined {
  const parts = value.split("-");
  if (parts[0] !== "xendit" || parts[1] !== "encrypted") {
    throw new Error(
      "Unexpected value in encrypted field, this is a bug, please contact support.",
    );
  }
  if (parts.length === 6) {
    // ok, normal encrypted value
    return undefined;
  } else if (parts.length === 8 && parts[6] === "invalid") {
    // validation error encoded
    const encodedError = parts[7];
    const decoded = atob(encodedError);
    return { localeKey: decoded as LocaleKey["localeKey"] };
  }
  throw new Error(
    "Unexpected value in encrypted field, this is a bug, please contact support.",
  );
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
      return validateEncryptedCardField(value);
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
  showBillingDetails: boolean,
): boolean {
  if (!channelProperties) channelProperties = {};

  for (const field of filterFormFields(
    sessionType,
    channel.form,
    showBillingDetails,
    channelProperties,
  )) {
    if (channelPropertyFieldValidate(field, channelProperties)) {
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

export function getChannelPropertyValue(
  channelProperties: ChannelProperties,
  key: string,
): ChannelPropertyPrimative | ChannelPropertyPrimative[] | undefined {
  const parts = key.split(".");
  const value = channelProperties[parts[0]];
  if (value === undefined) {
    return undefined;
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
