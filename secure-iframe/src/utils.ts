export function assert(value: unknown, iframeErrorCode: string): asserts value {
  if (!value) {
    const err = new Error("Assertion failure");
    (err as unknown as { code: string }).code = iframeErrorCode;
    throw err;
  }
}

export function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  let i = 0;
  for (const c of binaryString) {
    bytes[i] = c.charCodeAt(0);
    i += 1;
  }
  return bytes.buffer;
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const textEncoder = new TextEncoder();

export function stringToUtf8Bytes(str: string): Uint8Array<ArrayBuffer> {
  return textEncoder.encode(str);
}

export type AllowedCssProperty = "fontFamily" | "fontSize";

export function sanitizeCssValue(
  value: string,
  property: AllowedCssProperty,
): string {
  if (!value || typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  // Global XSS patterns
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

  for (const p of GLOBAL_FORBIDDEN) {
    if (p.test(trimmed)) return "";
  }

  switch (property) {
    case "fontFamily": {
      const isValid = /^[a-zA-Z0-9\s"',\\-]+$/i.test(trimmed);

      if (!isValid) return "";

      // Balanced quotes only
      const dq = (trimmed.match(/"/g) || []).length;
      const sq = (trimmed.match(/'/g) || []).length;
      if (dq % 2 !== 0 || sq % 2 !== 0) return "";

      // Avoid empty names or double commas
      if (/,\s*,/.test(trimmed)) return "";

      // Length limits
      if (trimmed.length > 200) return "";

      return trimmed;
    }

    case "fontSize": {
      /**
       * Safe CSS units only with reasonable length limits.
       */
      const SIZE = /^(\d+(\.\d+)?(px|em|rem|%|pt|vw|vh|vmin|vmax))$/i;

      if (!SIZE.test(trimmed)) return "";

      // Length limits to prevent overly large values
      if (trimmed.length > 20) return "";

      return trimmed;
    }

    default:
      return "";
  }
}

export function applyInputStyles(
  input: HTMLInputElement,
  properties?: { fontFamily?: string; fontSize?: string },
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
}
