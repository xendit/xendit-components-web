import { FormFieldValidationError, LocalizedString } from "../../shared/types";
import { ChannelFormField } from "./backend-types/channel";
import { isLocalizedString } from "./validation";
import { createInstance } from "i18next";
import en from "./locale/en.json";
import id from "./locale/id.json";
import th from "./locale/th.json";
import vi from "./locale/vi.json";

// Create our own isolated i18next instance to avoid conflicts with merchant's i18n
const xenditI18n = createInstance();

// Initialize our i18next instance
const initI18n = (locale: string) => {
  if (!xenditI18n.isInitialized) {
    xenditI18n.init({
      lng: locale,
      fallbackLng: "en",
      supportedLngs: ["en", "id", "th", "vi"],
      debug: false,
      defaultNS: "session",
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      resources: {
        en: en,
        id: id,
        th: th,
        vi: vi,
      },
    });
  }
};

// Map error codes to i18n keys
const errorCodeToI18nKey = (errorCode: FormFieldValidationError | string) => {
  switch (errorCode) {
    case "FIELD_IS_REQUIRED":
      return "validation.required";
    case "INVALID_EMAIL_FORMAT":
    case "INVALID_PHONE_NUMBER":
    case "INVALID_POSTAL_CODE":
    case "INVALID_COUNTRY":
      return "validation.generic_invalid";
    case "TEXT_TOO_SHORT":
      return "validation.text_too_short";
    case "TEXT_TOO_LONG":
      return "validation.text_too_long";
    default:
      throw new Error(`Unrecognized error code: ${errorCode}`);
  }
};

// Get localized error message
export const getLocalizedErrorMessage = (
  errorCode: FormFieldValidationError | LocalizedString | null,
  field: ChannelFormField,
  locale: string,
): string | null => {
  if (!errorCode) return null;

  // If it's already a localized string, return it directly
  if (isLocalizedString(errorCode)) {
    return errorCode;
  }

  // Initialize our i18n instance only if not already initialized, then set locale
  if (!xenditI18n.isInitialized) {
    initI18n(locale);
  }

  const i18nKey = errorCodeToI18nKey(errorCode);

  const t = xenditI18n.getFixedT(locale, "session");
  // Get localized message with field name interpolation
  return t(i18nKey, { field: field.label });
};
