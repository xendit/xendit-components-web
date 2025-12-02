import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeCssValue, applyInputStyles } from "../utils";

describe("sanitizeCssValue", () => {
  describe("fontFamily", () => {
    it("allows safe font families", () => {
      expect(sanitizeCssValue("Arial, sans-serif", "fontFamily")).toBe(
        "Arial, sans-serif",
      );
      expect(sanitizeCssValue('"Times New Roman", serif', "fontFamily")).toBe(
        '"Times New Roman", serif',
      );
      expect(sanitizeCssValue("Helvetica-Light", "fontFamily")).toBe(
        "Helvetica-Light",
      );
      expect(sanitizeCssValue("'Courier New'", "fontFamily")).toBe(
        "'Courier New'",
      );
    });

    it("rejects potentially dangerous font families", () => {
      expect(sanitizeCssValue("Arial; background: red;", "fontFamily")).toBe(
        "",
      );
      expect(
        sanitizeCssValue(
          'Arial</style><script>alert("xss")</script>',
          "fontFamily",
        ),
      ).toBe("");
      expect(sanitizeCssValue("Arial{color:red}", "fontFamily")).toBe("");
      expect(sanitizeCssValue('javascript:alert("xss")', "fontFamily")).toBe(
        "",
      );
      expect(
        sanitizeCssValue('url(javascript:alert("xss"))', "fontFamily"),
      ).toBe("");
      expect(sanitizeCssValue('expression(alert("xss"))', "fontFamily")).toBe(
        "",
      );
      expect(sanitizeCssValue('vbscript:alert("xss")', "fontFamily")).toBe("");
      expect(sanitizeCssValue('data:text/css,alert("xss")', "fontFamily")).toBe(
        "",
      );
      expect(sanitizeCssValue("Arial&amp;test", "fontFamily")).toBe("");
      expect(sanitizeCssValue("Arial/*comment*/", "fontFamily")).toBe("");
      expect(sanitizeCssValue("Arial@import", "fontFamily")).toBe("");
    });

    it("rejects overly long font families", () => {
      const longFont = "A".repeat(201);
      expect(sanitizeCssValue(longFont, "fontFamily")).toBe("");
    });

    it("rejects unbalanced quotes", () => {
      expect(sanitizeCssValue('"Arial', "fontFamily")).toBe("");
      expect(sanitizeCssValue("Arial'", "fontFamily")).toBe("");
      expect(sanitizeCssValue("\"Arial' test", "fontFamily")).toBe("");
    });

    it("rejects double commas and invalid characters", () => {
      expect(sanitizeCssValue("Arial,, Helvetica", "fontFamily")).toBe("");
      expect(sanitizeCssValue("Arial{test}", "fontFamily")).toBe("");
    });

    it("handles edge cases", () => {
      expect(sanitizeCssValue("", "fontFamily")).toBe("");
      expect(sanitizeCssValue(null as unknown as string, "fontFamily")).toBe(
        "",
      );
      expect(
        sanitizeCssValue(undefined as unknown as string, "fontFamily"),
      ).toBe("");
      expect(sanitizeCssValue(123 as unknown as string, "fontFamily")).toBe("");
    });
  });

  describe("fontSize", () => {
    it("allows safe font sizes", () => {
      expect(sanitizeCssValue("16px", "fontSize")).toBe("16px");
      expect(sanitizeCssValue("1.2em", "fontSize")).toBe("1.2em");
      expect(sanitizeCssValue("1.5rem", "fontSize")).toBe("1.5rem");
      expect(sanitizeCssValue("100%", "fontSize")).toBe("100%");
      expect(sanitizeCssValue("12pt", "fontSize")).toBe("12pt");
      expect(sanitizeCssValue("50vw", "fontSize")).toBe("50vw");
      expect(sanitizeCssValue("25vh", "fontSize")).toBe("25vh");
      expect(sanitizeCssValue("2.5vmin", "fontSize")).toBe("2.5vmin");
      expect(sanitizeCssValue("3.0vmax", "fontSize")).toBe("3.0vmax");
    });

    it("rejects potentially dangerous font sizes", () => {
      expect(sanitizeCssValue("16px; color: red;", "fontSize")).toBe("");
      expect(sanitizeCssValue("calc(100% - 10px)", "fontSize")).toBe("");
      expect(sanitizeCssValue('javascript:alert("xss")', "fontSize")).toBe("");
      expect(sanitizeCssValue('url(javascript:alert("xss"))', "fontSize")).toBe(
        "",
      );
      expect(sanitizeCssValue('expression(alert("xss"))', "fontSize")).toBe("");
      expect(sanitizeCssValue('vbscript:alert("xss")', "fontSize")).toBe("");
      expect(sanitizeCssValue('data:text/css,alert("xss")', "fontSize")).toBe(
        "",
      );
      expect(sanitizeCssValue("16px<script>", "fontSize")).toBe("");
      expect(sanitizeCssValue("16px{color:red}", "fontSize")).toBe("");
      expect(sanitizeCssValue("large", "fontSize")).toBe(""); // keyword values not supported
      expect(sanitizeCssValue("16", "fontSize")).toBe(""); // missing unit
      expect(sanitizeCssValue("px", "fontSize")).toBe(""); // missing number
    });

    it("rejects overly long font sizes", () => {
      const longSize = "1".repeat(25) + "px";
      expect(sanitizeCssValue(longSize, "fontSize")).toBe("");
    });

    it("handles edge cases", () => {
      expect(sanitizeCssValue("", "fontSize")).toBe("");
      expect(sanitizeCssValue(null as unknown as string, "fontSize")).toBe("");
      expect(sanitizeCssValue(undefined as unknown as string, "fontSize")).toBe(
        "",
      );
      expect(sanitizeCssValue(123 as unknown as string, "fontSize")).toBe("");
    });
  });
});

describe("applyInputStyles", () => {
  let mockInput: HTMLInputElement;

  beforeEach(() => {
    // Mock HTMLInputElement
    mockInput = {
      style: {},
    } as HTMLInputElement;
  });

  it("applies safe font family and size", () => {
    applyInputStyles(mockInput, {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
    });

    expect(mockInput.style.fontFamily).toBe("Arial, sans-serif");
    expect(mockInput.style.fontSize).toBe("16px");
  });

  it("sanitizes dangerous values", () => {
    applyInputStyles(mockInput, {
      fontFamily: "Arial; background: red;",
      fontSize: "16px; color: red;",
    });

    expect(mockInput.style.fontFamily).toBe("");
    expect(mockInput.style.fontSize).toBe("");
  });
});
