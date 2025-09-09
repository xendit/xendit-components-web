import { describe, it, expect } from "vitest";
import { validateCountry } from "../country";

describe("validateCountry", () => {
  it("returns invalid for empty string", () => {
    const result = validateCountry("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toEqual(["INVALID_COUNTRY"]);
  });

  it("returns empty for whitespace string", () => {
    const result = validateCountry("   ");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toEqual(["INVALID_COUNTRY"]);
  });

  it("validates correct 2-letter country code", () => {
    const validCodes = ["US", "GB", "SG", "ID", "MY", "PH", "TH", "VN"];
    validCodes.forEach((code) => {
      const result = validateCountry(code);
      expect(result.valid).toBe(true);
      expect(result.errorCodes).toEqual([]);
      expect(result.empty).toBe(false);
    });
  });

  it("invalidates incorrect country codes", () => {
    const invalidCodes = [
      "U", // too short
      "USA", // too long
      "us", // lowercase
      "123", // numbers
      "U$", // special character
      "U S", // space
      "@#", // symbols
      "U1", // letter + number
    ];
    invalidCodes.forEach((code) => {
      const result = validateCountry(code);
      expect(result.valid).toBe(false);
      expect(result.errorCodes).toContain("INVALID_COUNTRY");
      expect(result.empty).toBe(false);
    });
  });
});
