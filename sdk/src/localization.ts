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
      interpolation: {
        escapeValue: false, // not needed for react as it escapes by default
      },
      resources: {
        en: { translation: en },
        id: { translation: id },
        th: { translation: th },
        vi: { translation: vi },
      },
    });
  } else {
    xenditI18n.changeLanguage(locale);
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
  } else if (xenditI18n.language !== locale) {
    xenditI18n.changeLanguage(locale);
  }

  const i18nKey = errorCodeToI18nKey(errorCode);

  const translationKey =
    `session.${i18nKey}` as `session.${keyof typeof en.session}`;

  if (!xenditI18n.exists(translationKey)) {
    // Fallback to English if translation doesn't exist in current locale
    const englishTranslation = xenditI18n.t(translationKey, {
      field: field.label,
      lng: "en",
    });
    return englishTranslation !== translationKey ? englishTranslation : i18nKey;
  }

  // Get localized message with field name interpolation
  return xenditI18n.t(translationKey, { field: field.label });
};
