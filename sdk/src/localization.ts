import { ChannelFormField } from "./backend-types/channel";
import en from "./locale/en.json";

/** @public */
export type Locale = "en" | "id" | "th" | "vi" | "es";

const localeMap: {
  // all keys must be present in english but are optional in others
  [K in Locale]: K extends "en"
    ? typeof en.session
    : Partial<typeof en.session>;
} = {
  en: en.session,
  id: {},
  th: {},
  vi: {},
  es: {},
};

function isLocale(locale: string): locale is Locale {
  return locale in localeMap;
}

export async function loadLocale(locale: string) {
  let data: Partial<typeof en.session> | null = null;
  switch (locale) {
    case "en":
      return;
    case "id":
      data = (await import("./locale/id.json")).session;
      break;
    case "th":
      data = (await import("./locale/th.json")).session;
      break;
    case "vi":
      data = (await import("./locale/vi.json")).session;
      break;
    case "es":
      data = (await import("./locale/es.json")).session;
      break;
    default:
      // unknown locale, this is ok because a new locale might have been added to the api
      return;
  }
  localeMap[locale] = data;
}

export type InterceptLocaleStringsFn = (
  strings: Partial<(typeof localeMap)["en"]>,
) => Partial<(typeof localeMap)["en"]>;

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
export function createTFunction(
  locale: string,
  interceptLocaleStrings: InterceptLocaleStringsFn | undefined,
): TFunction {
  const resolvedLocale: Locale = isLocale(locale) ? locale : "en";
  const interceptFn = interceptLocaleStrings ?? ((obj) => obj);
  const localeData = interceptFn(localeMap[resolvedLocale]);

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

// An encapsulated already-localized string
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
  field: ChannelFormField | string,
): string | null => {
  if (!errorCode) return null;

  if (!isLocaleKey(errorCode)) {
    return errorCode.value;
  }

  // Get localized message with field name interpolation using i18n key directly
  return t(errorCode.localeKey, {
    field: typeof field === "string" ? field : field.label,
  });
};
