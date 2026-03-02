import type { IframeAppearanceOptions } from "../../sdk/src";

// map of allowed CSS properties to their corresponding CSS style names
const allowedCssPropertyMap = {
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  color: "color",
  backgroundColor: "background-color",
} as const;

/**
 * Properties allowed to be set on input elements.
 */
export type AllowedCssProperty = keyof typeof allowedCssPropertyMap;

const SUS_PATTERNS = [
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

/**
 * Validate a CSS value for a given property.
 */
function validateStyle(property: string, value: string): boolean {
  const supportsTypedOM =
    typeof CSSStyleValue !== "undefined" &&
    typeof CSSStyleValue.parse === "function";

  if (!supportsTypedOM) {
    // only firefox doesn't support this
    return true;
  }

  try {
    CSSStyleValue.parse(property, value);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeCssValue(
  value: string,
  property: AllowedCssProperty,
): string {
  if (!value || typeof value !== "string") {
    // not a valid value
    return "";
  }

  const propertyName = allowedCssPropertyMap[property];
  if (!propertyName) {
    // not allowed
    return "";
  }

  // These are defense-in-depth checks against css injections.
  // It should not affect anything at all, any value that fails here would also fail to assign to the style property.
  for (const pattern of SUS_PATTERNS) {
    if (pattern.test(value)) return "";
  }
  if (!validateStyle(propertyName, value)) {
    return "";
  }

  return value;
}

const CUSTOM_FONT_NAME = "xendit-iframe-custom-font";

export function applyInputStyles(
  input: HTMLInputElement,
  options?: IframeAppearanceOptions,
): void {
  if (!options || typeof options !== "object") return;
  const styles = options.inputStyles;
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
