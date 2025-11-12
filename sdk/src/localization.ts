import { FormFieldValidationError } from "../../shared/types";
import { ChannelFormField } from "./backend-types/channel";
import i18next from "i18next";

// Import locale files
import en from "./locale/en.json";
import id from "./locale/id.json";
import th from "./locale/th.json";
import vn from "./locale/vn.json";

// Initialize i18next
const initI18n = (locale: string) => {
  if (!i18next.isInitialized) {
    i18next.init({
      lng: locale,
      fallbackLng: "en",
      debug: false,
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      resources: {
        en: { translation: en },
        id: { translation: id },
        th: { translation: th },
        vn: { translation: vn },
      },
    });
  } else {
    // Change language if already initialized
    i18next.changeLanguage(locale);
  }
};

// Map error codes to i18n keys
const errorCodeToI18nKey = (
  errorCode: FormFieldValidationError | string,
): string => {
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
      // For unknown error codes (likely custom regex validation messages),
      // return the error code as-is since it's already a localized message
      return errorCode;
  }
};

// Get localized error message
export const getLocalizedErrorMessage = (
  errorCode: FormFieldValidationError | string | null,
  field: ChannelFormField,
  locale: string,
): string | null => {
  if (!errorCode) return null;

  // Initialize i18n only if not already initialized, then set locale
  if (!i18next.isInitialized) {
    initI18n(locale);
  } else if (i18next.language !== locale) {
    i18next.changeLanguage(locale);
  }

  const i18nKey = errorCodeToI18nKey(errorCode);

  // If the error code is not a standard validation key (i.e., it's a custom message), return it as-is
  if (!i18nKey.startsWith("validation.")) {
    return i18nKey; // This is already a custom localized message from regex validators
  }

  // Get localized message with field name interpolation
  return i18next.t(i18nKey, { field: field.label });
};
