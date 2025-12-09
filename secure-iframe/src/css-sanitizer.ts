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

export function applyInputStyles(
  input: HTMLInputElement,
  properties?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    color?: string;
    backgroundColor?: string;
  },
): void {
  if (!properties) return;

  if (properties.fontFamily) {
    input.style.fontFamily = sanitizeCssValue(
      properties.fontFamily,
      "fontFamily",
    );
  }

  if (properties.fontSize) {
    input.style.fontSize = sanitizeCssValue(properties.fontSize, "fontSize");
  }

  if (properties.fontWeight) {
    input.style.fontWeight = sanitizeCssValue(
      properties.fontWeight,
      "fontWeight",
    );
  }

  if (properties.lineHeight) {
    input.style.lineHeight = sanitizeCssValue(
      properties.lineHeight,
      "lineHeight",
    );
  }

  if (properties.letterSpacing) {
    input.style.letterSpacing = sanitizeCssValue(
      properties.letterSpacing,
      "letterSpacing",
    );
  }

  if (properties.color) {
    input.style.color = sanitizeCssValue(properties.color, "color");
  }

  if (properties.backgroundColor) {
    input.style.backgroundColor = sanitizeCssValue(
      properties.backgroundColor,
      "backgroundColor",
    );
  }
}
