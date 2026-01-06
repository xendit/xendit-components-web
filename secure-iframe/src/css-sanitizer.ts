import { IframeAppearanceOptions } from "../../shared/types";

export type AllowedCssProperty =
  | "fontFamily"
  | "fontSize"
  | "fontWeight"
  | "lineHeight"
  | "letterSpacing"
  | "color"
  | "backgroundColor";

/**
 * Validate CSS value using browser's native CSS parser
 */
function isValidCssValue(value: string, property: string): boolean {
  const supportsTypedOM =
    typeof CSSStyleValue !== "undefined" &&
    typeof CSSStyleValue.parse === "function";

  if (!supportsTypedOM) {
    // No Typed OM → skip validation
    return true;
  }

  try {
    CSSStyleValue.parse(property, value);
    return true;
  } catch {
    return false;
  }
}

function validateFontFamily(value: string): string {
  const isValid = /^[a-zA-Z0-9\s"',\\-]+$/i.test(value);
  if (!isValid) return "";

  // Avoid empty names or double commas
  if (/,\s*,/.test(value)) return "";

  // Length limits
  if (value.length > 200) return "";

  // Validate using browser's CSS parser
  if (!isValidCssValue(value, "font-family")) return "";

  return value;
}

function validateFontSize(value: string): string {
  const SIZE = /^(\d+(\.\d+)?(px|em|rem|%|pt|vw|vh|vmin|vmax))$/i;
  if (!SIZE.test(value)) return "";

  // Length limits to prevent overly large values
  if (value.length > 20) return "";

  // Validate using browser's CSS parser
  if (!isValidCssValue(value, "font-size")) return "";

  return value;
}

function validateFontWeight(value: string): string {
  const WEIGHT = /^(normal|bold|bolder|lighter|[1-9]00)$/i;
  if (!WEIGHT.test(value)) return "";

  if (value.length > 10) return "";

  if (!isValidCssValue(value, "font-weight")) return "";

  return value;
}

function validateLineHeight(value: string): string {
  const LINE_HEIGHT = /^(normal|\d+(\.\d+)?(px|em|rem|%)?|\d+(\.\d+))$/i;
  if (!LINE_HEIGHT.test(value)) return "";

  if (value.length > 15) return "";

  if (!isValidCssValue(value, "line-height")) return "";

  return value;
}

function validateLetterSpacing(value: string): string {
  const LETTER_SPACING = /^(normal|-?\d+(\.\d+)?(px|em|rem))$/i;
  if (!LETTER_SPACING.test(value)) return "";

  if (value.length > 15) return "";

  if (!isValidCssValue(value, "letter-spacing")) return "";

  return value;
}

function validateColor(value: string): string {
  // Support hex colors, rgb/rgba, hsl/hsla, and named colors
  const COLOR =
    /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|transparent|currentcolor|inherit|initial|unset|[a-z]+)$/i;

  if (!COLOR.test(value)) return "";

  if (value.length > 50) return "";

  if (!isValidCssValue(value, "color")) return "";

  return value;
}

function validateBackgroundColor(value: string): string {
  // Same validation as color since background-color accepts the same values
  const COLOR =
    /^(#[0-9a-f]{3,8}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)|hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)|transparent|currentcolor|inherit|initial|unset|[a-z]+)$/i;

  if (!COLOR.test(value)) return "";

  if (value.length > 50) return "";

  if (!isValidCssValue(value, "background-color")) return "";

  return value;
}

export function sanitizeCssValue(
  value: string,
  property: AllowedCssProperty,
): string {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  // Global XSS patterns - check first for security
  const GLOBAL_FORBIDDEN = [
    /url\s*\(/i,
    /javascript:/i,
    /vbscript:/i,
    /data:/i,
    /expression\s*\(/i,
    /behavior\s*:/i,
    /@import/i,
    /-moz-binding/i,
    /<|>/,
    /&#/i,
    /\/\*|\*\//,
    /[;{}]/,
  ];

  for (const pattern of GLOBAL_FORBIDDEN) {
    if (pattern.test(trimmed)) return "";
  }

  switch (property) {
    case "fontFamily":
      return validateFontFamily(trimmed);
    case "fontSize":
      return validateFontSize(trimmed);
    case "fontWeight":
      return validateFontWeight(trimmed);
    case "lineHeight":
      return validateLineHeight(trimmed);
    case "letterSpacing":
      return validateLetterSpacing(trimmed);
    case "color":
      return validateColor(trimmed);
    case "backgroundColor":
      return validateBackgroundColor(trimmed);
    default:
      return "";
  }
}

const CUSTOM_FONT_NAME = "xendit-iframe-custom-font";

export function applyInputStyles(
  input: HTMLInputElement,
  options?: IframeAppearanceOptions,
): void {
  if (!options || typeof options !== "object") return;
  const styles = options.inputFieldStyles;
  if (styles && typeof styles !== "object") return; // allow undefined or object only

  if (options.fontFace) {
    // if user provided a custom font face, use font name we loaded the font as
    input.style.fontFamily = `${CUSTOM_FONT_NAME}, sans-serif`;
  } else if (styles?.fontFamily) {
    input.style.fontFamily = sanitizeCssValue(styles.fontFamily, "fontFamily");
  }

  if (styles?.fontSize) {
    input.style.fontSize = sanitizeCssValue(styles.fontSize, "fontSize");
  }

  if (options.fontFace) {
    input.style.fontWeight = "normal";
  } else if (styles?.fontWeight) {
    input.style.fontWeight = sanitizeCssValue(styles.fontWeight, "fontWeight");
  }

  if (styles?.lineHeight) {
    input.style.lineHeight = sanitizeCssValue(styles.lineHeight, "lineHeight");
  }

  if (styles?.letterSpacing) {
    input.style.letterSpacing = sanitizeCssValue(
      styles.letterSpacing,
      "letterSpacing",
    );
  }

  if (styles?.color) {
    input.style.color = sanitizeCssValue(styles.color, "color");
  }

  if (styles?.backgroundColor) {
    input.style.backgroundColor = sanitizeCssValue(
      styles.backgroundColor,
      "backgroundColor",
    );
  }
}

export function applyPlaceholderStyles(
  input: HTMLInputElement,
  options?: IframeAppearanceOptions,
) {
  if (!options || typeof options !== "object") return;
  const styles = options.placeholderStyles;

  if (styles?.color) {
    document.documentElement.style.setProperty(
      "--xendit-iframe-placeholder-color",
      sanitizeCssValue(styles.color, "color"),
    );
  }
}

export function applyFontFace(options: IframeAppearanceOptions): void {
  if (!window.FontFace) return;
  // @ts-expect-error add funciton is missing from typescript definitions
  if (!document.fonts?.add) return;
  if (!options.fontFace || !options.fontFace.source) return;

  const fontFace = new FontFace(CUSTOM_FONT_NAME, options.fontFace.source, {
    display: options.fontFace.descriptors?.display ?? "auto",
    style: options.fontFace.descriptors?.style ?? "normal",
    stretch: options.fontFace.descriptors?.stretch ?? "normal",
    weight: "normal",
  });

  // @ts-expect-error add funciton is missing from typescript definitions
  document.fonts.add(fontFace);
}
