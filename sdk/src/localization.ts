import { ChannelFormField } from "./backend-types/channel";
import { createInstance, TFunction } from "i18next";
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

/**
 * @internal
 */
export const initI18n = (locale: string) => {
  const i18n = createInstance();
  i18n.init({
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
  return i18n;
};

// Type guard function to check if errorCode is LocaleKey
export const isLocaleKey = (errorCode: unknown): errorCode is LocaleKey => {
  return (
    typeof errorCode === "object" &&
    errorCode !== null &&
    "localeKey" in errorCode
  );
};

// Get localized error message
export const getLocalizedErrorMessage = (
  t: TFunction<"session">,
  errorCode: LocaleKey | LocalizedString,
  field: ChannelFormField,
): string | null => {
  if (!errorCode) return null;

  if (!isLocaleKey(errorCode)) {
    return errorCode.value;
  }

  // Get localized message with field name interpolation using i18n key directly
  return t(errorCode.localeKey, { field: field.label });
};
