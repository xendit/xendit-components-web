import { ChannelFormField } from "./backend-types/channel";
import en from "./locale/en.json";
import id from "./locale/id.json";
import th from "./locale/th.json";
import vi from "./locale/vi.json";

const localeMap: {
  en: typeof en.session;
  [locale: string]: Partial<typeof en.session>;
} = {
  en: en.session,
  id: id.session,
  th: th.session,
  vi: vi.session,
};

type InterpolationOptions = Record<string, string | number>;

/**
 * Localization interface.
 *
 * ```
 * t("key") -> Localize "key", falling back to "key"
 * t("key", "fallback") -> Localize "key", falling back to "fallback"
 * t("key", { var: value }) -> Localize "key" with interpolation, falling back to "key"
 * t("key", "fallback", { var: value }) -> Localize "key" with interpolation, falling back to "fallback"
 * ```
 */
export interface TFunction {
  (key: keyof typeof en.session): string;
  (key: keyof typeof en.session, fallback: string): string;
  (key: keyof typeof en.session, options: InterpolationOptions): string;
  (
    key: keyof typeof en.session,
    fallback: string,
    options: InterpolationOptions,
  ): string;
}

/**
 * Generate a TFunction for a locale.
 */
export function createTFunction(locale: string): TFunction {
  const localeData = localeMap[locale];
  const tFn: TFunction = function (...args: unknown[]) {
    let key: keyof typeof en.session;
    let fallback: string | undefined;
    let options: InterpolationOptions = {};

    switch (args.length) {
      case 1:
        key = args[0] as keyof typeof en.session;
        break;
      case 2:
        if (typeof args[1] === "string") {
          key = args[0] as keyof typeof en.session;
          fallback = args[1];
        } else {
          key = args[0] as keyof typeof en.session;
          options = args[1] as InterpolationOptions;
        }
        break;
      case 3:
        key = args[0] as keyof typeof en.session;
        fallback = args[1] as string;
        options = args[2] as InterpolationOptions;
        break;
      default:
        throw new Error("Invalid arguments for t function");
    }

    let template = localeData?.[key];
    if (template === undefined && fallback !== undefined) {
      template = fallback;
    }

    if (template) {
      return template.replace(/\{\{(\w+)\}\}/g, (_, varName: string) => {
        return options[varName] ? String(options[varName]) : "";
      });
    } else {
      console.warn(`Missing localization for key: ${key} in locale: ${locale}`);
      return key;
    }
  };
  return tFn;
}

// An encapsulated localizable string
export type LocaleKey = {
  localeKey: keyof typeof en.session;
};

// And encapsulated already-localized string
export type LocalizedString = {
  value: string;
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
  t: TFunction,
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
