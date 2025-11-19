import { ChannelFormField } from "./backend-types/channel";
import { createInstance } from "i18next";
import en from "./locale/en.json";
import id from "./locale/id.json";
import th from "./locale/th.json";
import vi from "./locale/vi.json";

const DEFAULT_NAMESPACE = "session";

export type LocaleKey = {
  localeKey: keyof (typeof en)[typeof DEFAULT_NAMESPACE];
};

export type LocalizedString = {
  value: string;
};

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
      defaultNS: DEFAULT_NAMESPACE,
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

// Type guard function to check if errorCode is LocaleKey
export const isLocaleKey = (
  errorCode: LocaleKey | LocalizedString,
): errorCode is LocaleKey => {
  return (
    typeof errorCode === "object" &&
    errorCode !== null &&
    "localeKey" in errorCode
  );
};

// Get localized error message
export const getLocalizedErrorMessage = (
  errorCode: LocaleKey | LocalizedString,
  field: ChannelFormField,
  locale: string,
): string | null => {
  if (!errorCode) return null;

  if (!isLocaleKey(errorCode)) {
    return errorCode.value;
  }
  // Initialize our i18n instance only if not already initialized, then set locale
  if (!xenditI18n.isInitialized) {
    initI18n(locale);
  }

  const t = xenditI18n.getFixedT(locale, "session");

  // Get localized message with field name interpolation using i18n key directly
  return t(errorCode.localeKey, { field: field.label });
};
