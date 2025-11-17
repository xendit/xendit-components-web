import { FormFieldValidationError } from "../../shared/types";
import {
  BffChannel,
  ChannelFormField,
  ChannelProperties,
  ChannelPropertyPrimative,
} from "./backend-types/channel";
import parsePhoneNumberFromString from "libphonenumber-js/min";
import { filterFormFields } from "./components/channel-form";
import { BffSessionType } from "./backend-types/session";

export type ValidationResult = {
  errorCode: FormFieldValidationError | undefined;
};

export const validateEmail = (
  value: string,
): FormFieldValidationError | undefined => {
  const trimmedValue = value.trim();
  // Allows letters, numbers, dots, underscores, hyphens before the @
  // Domain must be letters, numbers, hyphens (no leading/trailing hyphen)
  // TLD must be at least 2 letters
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[A-Za-z]{2,}$/;

  if (trimmedValue.length > 0 && !emailRegex.test(trimmedValue))
    return "INVALID_EMAIL_FORMAT";
};

export const validatePhoneNumber = (
  value: string,
): FormFieldValidationError | undefined => {
  const input = value?.trim();
  if (!input) return "INVALID_PHONE_NUMBER";

  const phone = parsePhoneNumberFromString(input);
  if (!phone) return "INVALID_PHONE_NUMBER";

  return phone.isValid() ? undefined : "INVALID_PHONE_NUMBER";
};

export const validatePostalCode = (
  value: string,
): FormFieldValidationError | undefined => {
  const trimmedValue = value.trim();

  // Basic validation: must be non-empty and contain only letters, numbers, spaces, or hyphens
  if (!/^(?![-\s]+)[A-Za-z0-9\s-]+$/.test(trimmedValue)) {
    return "INVALID_POSTAL_CODE";
  }
};

// TODO: implement localization for error messages
type LocalizedString = string;

export const validateText = (
  input: ChannelFormField & {
    type: { name: "text" };
  },
  value: string,
): FormFieldValidationError | LocalizedString | undefined => {
  const trimmedValue = value.trim();

  if (Array.isArray(input.type.regex_validators)) {
    for (const pattern of input.type.regex_validators) {
      const regex = new RegExp(sanitizeRegex(pattern.regex));
      if (!regex.test(trimmedValue)) {
        return pattern.message;
      }
    }
  }

  if (trimmedValue.length < (input.type.min_length ?? 1)) {
    return "TEXT_TOO_SHORT";
  } else if (trimmedValue.length > input.type.max_length) {
    return "TEXT_TOO_LONG";
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
): FormFieldValidationError | LocalizedString | undefined {
  if (input.required && value.trim().length === 0) {
    return "FIELD_IS_REQUIRED";
  }

  switch (input.type.name) {
    case "credit_card_number":
    case "credit_card_expiry":
    case "credit_card_cvn": {
      // these are encrypted, no validation
      return undefined;
    }
    case "phone_number":
      return validatePhoneNumber(value);
    case "email":
      return validateEmail(value);
    case "postal_code":
      return validatePostalCode(value);
    case "text":
      return validateText(
        input as ChannelFormField & {
          type: { name: "text" };
        },
        value,
      );
    case "country":
    case "province":
    case "dropdown": {
      // no validation required for now
      return undefined;
    }

    default:
      input.type satisfies never;
      throw new Error(
        `Unsupported input type: ${(input as ChannelFormField).type.name}; this is a bug, please contact support.`,
      );
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
  )) {
    const channelPropertyKeys = Array.isArray(field.channel_property)
      ? field.channel_property
      : [field.channel_property];
    for (const key of channelPropertyKeys) {
      let value = getChannelPropertyValue(channelProperties, key);
      if (value === undefined || value === "") {
        if (field.required) {
          return false;
        } else {
          value = "";
        }
      }
      if (typeof value !== "string") {
        // validation for non-string values not supported
        continue;
      }
      const error = validate(field, value);
      if (error) {
        return false;
      }
    }
  }

  return true;
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
