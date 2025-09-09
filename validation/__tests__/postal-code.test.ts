import { expect } from "vitest";
import { validatePostalCode } from "../postal-code";

describe("validatePostalCode", () => {
  it("returns invalid for empty string", () => {
    const result = validatePostalCode("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("INVALID_POSTAL_CODE");
  });

  it("returns invalid for whitespace string", () => {
    const result = validatePostalCode("   ");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("INVALID_POSTAL_CODE");
  });

  it("validates correct postal codes", () => {
    const validCodes = [
      "90210", // US ZIP
      "SW1A 1AA", // UK
      "238801", // Singapore
      "12345-6789", // US ZIP+4
      "A1B 2C3", // Canada
      "75008", // France
      "10110", // Thailand
      "08123-456", // Indonesia
      "123 456", // Spaces
      "abc-123", // Letters and hyphen
    ];
    validCodes.forEach((code) => {
      const result = validatePostalCode(code);
      expect(result.valid).toBe(true);
      expect(result.errorCodes).toEqual([]);
      expect(result.empty).toBe(false);
    });
  });

  it("invalidates codes with special characters", () => {
    const invalidCodes = [
      "12345!", // exclamation
      "12@345", // @ symbol
      "12#345", // # symbol
      "12$345", // $ symbol
      "12%345", // % symbol
      "12*345", // * symbol
      "12_345", // underscore
      "12/345", // slash
      "12.345", // dot
      "12,345", // comma
    ];
    invalidCodes.forEach((code) => {
      const result = validatePostalCode(code);
      expect(result.valid).toBe(false);
      expect(result.errorCodes).toContain("INVALID_POSTAL_CODE");
      expect(result.empty).toBe(false);
    });
  });

  it("invalidates codes with only hyphens or spaces", () => {
    const invalidCodes = [
      "-", // only hyphen
      "   ", // only spaces
      "--", // multiple hyphens
      " - ", // spaces and hyphen
    ];
    invalidCodes.forEach((code) => {
      const result = validatePostalCode(code);
      expect(result.valid).toBe(false);
      expect(result.errorCodes).toContain("INVALID_POSTAL_CODE");
    });
  });
});
