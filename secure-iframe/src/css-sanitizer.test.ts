import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeCssValue, applyInputStyles } from "./css-sanitizer";

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

    it("applies additional CSS validation layer", () => {
      // Test that valid CSS values pass through the validation chain
      expect(sanitizeCssValue("16px", "fontSize")).toBe("16px");
      expect(sanitizeCssValue("1.2em", "fontSize")).toBe("1.2em");

      // Test that the function handles the CSS validation step gracefully
      expect(sanitizeCssValue("14pt", "fontSize")).toBe("14pt");
    });

    it("validates font size formats thoroughly", () => {
      // Test edge cases that would be caught by comprehensive validation
      expect(sanitizeCssValue("16px", "fontSize")).toBe("16px");
      expect(sanitizeCssValue("1.5rem", "fontSize")).toBe("1.5rem");

      // Values that should be rejected by the complete validation chain
      expect(sanitizeCssValue("invalid", "fontSize")).toBe("");
      expect(sanitizeCssValue("16px;", "fontSize")).toBe("");
    });
  });

  describe("fontFamily validation integration", () => {
    it("applies complete validation chain to font families", () => {
      // Test that valid font families pass through all validation layers
      expect(sanitizeCssValue("Arial", "fontFamily")).toBe("Arial");
      expect(sanitizeCssValue("Helvetica, Arial", "fontFamily")).toBe(
        "Helvetica, Arial",
      );

      // Test that the validation chain catches various invalid formats
      expect(sanitizeCssValue("Arial;", "fontFamily")).toBe("");
      expect(sanitizeCssValue("font{}", "fontFamily")).toBe("");
    });
  });

  describe("fontWeight", () => {
    it("allows valid font weights", () => {
      expect(sanitizeCssValue("normal", "fontWeight")).toBe("normal");
      expect(sanitizeCssValue("bold", "fontWeight")).toBe("bold");
      expect(sanitizeCssValue("400", "fontWeight")).toBe("400");
      expect(sanitizeCssValue("700", "fontWeight")).toBe("700");
    });

    it("rejects invalid font weights", () => {
      expect(sanitizeCssValue("heavy", "fontWeight")).toBe("");
      expect(sanitizeCssValue("1000", "fontWeight")).toBe("");
      expect(sanitizeCssValue("bold;", "fontWeight")).toBe("");
    });
  });

  describe("lineHeight", () => {
    it("allows valid line heights", () => {
      expect(sanitizeCssValue("normal", "lineHeight")).toBe("normal");
      expect(sanitizeCssValue("1.5", "lineHeight")).toBe("1.5");
      expect(sanitizeCssValue("24px", "lineHeight")).toBe("24px");
      expect(sanitizeCssValue("150%", "lineHeight")).toBe("150%");
    });

    it("rejects invalid line heights", () => {
      expect(sanitizeCssValue("invalid", "lineHeight")).toBe("");
      expect(sanitizeCssValue("1.5;", "lineHeight")).toBe("");
    });
  });

  describe("letterSpacing", () => {
    it("allows valid letter spacing", () => {
      expect(sanitizeCssValue("normal", "letterSpacing")).toBe("normal");
      expect(sanitizeCssValue("2px", "letterSpacing")).toBe("2px");
      expect(sanitizeCssValue("-1px", "letterSpacing")).toBe("-1px");
      expect(sanitizeCssValue("0.1em", "letterSpacing")).toBe("0.1em");
    });

    it("rejects invalid letter spacing", () => {
      expect(sanitizeCssValue("wide", "letterSpacing")).toBe("");
      expect(sanitizeCssValue("2px;", "letterSpacing")).toBe("");
    });
  });

  describe("color", () => {
    it("allows valid color values", () => {
      expect(sanitizeCssValue("#ff0000", "color")).toBe("#ff0000");
      expect(sanitizeCssValue("#f00", "color")).toBe("#f00");
      expect(sanitizeCssValue("rgb(255, 0, 0)", "color")).toBe(
        "rgb(255, 0, 0)",
      );
      expect(sanitizeCssValue("rgba(255, 0, 0, 0.5)", "color")).toBe(
        "rgba(255, 0, 0, 0.5)",
      );
      expect(sanitizeCssValue("hsl(0, 100%, 50%)", "color")).toBe(
        "hsl(0, 100%, 50%)",
      );
      expect(sanitizeCssValue("transparent", "color")).toBe("transparent");
      expect(sanitizeCssValue("red", "color")).toBe("red");
    });

    it("rejects invalid color values", () => {
      expect(sanitizeCssValue("invalid-color", "color")).toBe("");
      expect(sanitizeCssValue("#gggggg", "color")).toBe("");
      expect(sanitizeCssValue("red;", "color")).toBe("");
    });
  });

  describe("backgroundColor", () => {
    it("allows valid background color values", () => {
      expect(sanitizeCssValue("#ffffff", "backgroundColor")).toBe("#ffffff");
      expect(sanitizeCssValue("rgba(0, 0, 0, 0.1)", "backgroundColor")).toBe(
        "rgba(0, 0, 0, 0.1)",
      );
      expect(sanitizeCssValue("transparent", "backgroundColor")).toBe(
        "transparent",
      );
      expect(sanitizeCssValue("blue", "backgroundColor")).toBe("blue");
    });

    it("rejects invalid background color values", () => {
      expect(sanitizeCssValue("not-a-color", "backgroundColor")).toBe("");
      expect(sanitizeCssValue("blue;", "backgroundColor")).toBe("");
      expect(sanitizeCssValue("#xyz", "backgroundColor")).toBe("");
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
      fontWeight: "bold",
      lineHeight: "1.5",
      letterSpacing: "1px",
      color: "#333333",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
    });

    expect(mockInput.style.fontFamily).toBe("Arial, sans-serif");
    expect(mockInput.style.fontSize).toBe("16px");
    expect(mockInput.style.fontWeight).toBe("bold");
    expect(mockInput.style.lineHeight).toBe("1.5");
    expect(mockInput.style.letterSpacing).toBe("1px");
    expect(mockInput.style.color).toBe("#333333");
    expect(mockInput.style.backgroundColor).toBe("rgba(255, 255, 255, 0.9)");
  });

  it("sanitizes dangerous values", () => {
    applyInputStyles(mockInput, {
      fontFamily: "Arial; background: red;",
      fontSize: "16px; color: red;",
      fontWeight: "bold;",
      lineHeight: "1.5;",
      letterSpacing: "1px;",
      color: "red;",
      backgroundColor: "blue;",
    });

    expect(mockInput.style.fontFamily).toBe("");
    expect(mockInput.style.fontSize).toBe("");
    expect(mockInput.style.fontWeight).toBe("");
    expect(mockInput.style.lineHeight).toBe("");
    expect(mockInput.style.letterSpacing).toBe("");
    expect(mockInput.style.color).toBe("");
    expect(mockInput.style.backgroundColor).toBe("");
  });
});
