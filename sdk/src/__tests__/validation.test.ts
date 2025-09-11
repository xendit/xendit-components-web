import { describe, it, expect } from "vitest";
import {
  validateCountry,
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
  validateText,
} from "../validation";

import type { CountryCode } from "libphonenumber-js";

// --- validateCountry ---
describe("validateCountry", () => {
  it("returns undefined for valid 2-letter uppercase country code", () => {
    expect(validateCountry("ID")).toEqual({ errorCode: undefined });
    expect(validateCountry("US")).toEqual({ errorCode: undefined });
  });

  it("returns error for lowercase country code", () => {
    expect(validateCountry("id")).toEqual({ errorCode: "INVALID_COUNTRY" });
  });

  it("returns error for country code with spaces", () => {
    expect(validateCountry(" ID ")).toEqual({ errorCode: undefined });
    expect(validateCountry(" I D ")).toEqual({ errorCode: "INVALID_COUNTRY" });
  });

  it("returns error for country code with more than 2 letters", () => {
    expect(validateCountry("USA")).toEqual({ errorCode: "INVALID_COUNTRY" });
  });

  it("returns error for country code with numbers", () => {
    expect(validateCountry("1D")).toEqual({ errorCode: "INVALID_COUNTRY" });
  });

  it("returns error for empty string", () => {
    expect(validateCountry("")).toEqual({ errorCode: "INVALID_COUNTRY" });
  });
});

// --- validateEmail ---
describe("validateEmail", () => {
  it("returns undefined for valid email", () => {
    expect(validateEmail("test@example.com")).toEqual({ errorCode: undefined });
    expect(validateEmail("user.name+tag@sub.domain.co")).toEqual({
      errorCode: undefined,
    });
  });

  it("returns error for missing @", () => {
    expect(validateEmail("testexample.com")).toEqual({
      errorCode: "INVALID_EMAIL_FORMAT",
    });
  });

  it("returns error for missing domain", () => {
    expect(validateEmail("test@")).toEqual({
      errorCode: "INVALID_EMAIL_FORMAT",
    });
  });

  it("returns error for missing TLD", () => {
    expect(validateEmail("test@example")).toEqual({
      errorCode: "INVALID_EMAIL_FORMAT",
    });
  });

  it("returns error for invalid characters", () => {
    expect(validateEmail("test@exa mple.com")).toEqual({
      errorCode: "INVALID_EMAIL_FORMAT",
    });
    expect(validateEmail("test@.com")).toEqual({
      errorCode: "INVALID_EMAIL_FORMAT",
    });
  });

  it("returns undefined for empty string", () => {
    expect(validateEmail("")).toEqual({ errorCode: undefined });
  });

  it("trims input before validation", () => {
    expect(validateEmail("  test@example.com ")).toEqual({
      errorCode: undefined,
    });
  });
});

const countries: CountryCode[] = ["ID", "MY", "PH", "SG", "TH", "VN"];

const validNumbers: Record<string, string[]> = {
  ID: ["+628123456789", "08123456789"],
  MY: ["+60123456789", "0123456789"],
  PH: ["+639171234567", "09171234567"],
  SG: ["+6581234567", "81234567"],
  TH: ["+66812345678", "0812345678"],
  VN: ["+84901234567", "0901234567"],
};

const invalidNumbers: Record<string, string[]> = {
  ID: ["123", "abcdefgh", "+6281"],
  MY: ["123", "abcdefgh", "+6012"],
  PH: ["123", "abcdefgh", "+6391"],
  SG: ["123", "abcdefgh", "+6581"],
  TH: ["123", "abcdefgh", "+6681"],
  VN: ["123", "abcdefgh", "+8490"],
};

// --- validatePhoneNumber ---
describe("validatePhoneNumber", () => {
  countries.forEach((country) => {
    describe(`Country: ${country}`, () => {
      validNumbers[country].forEach((number) => {
        it(`validates valid number: ${number}`, () => {
          const result = validatePhoneNumber(number, country);
          expect(result.errorCode).toBeUndefined();
        });
      });

      invalidNumbers[country].forEach((number) => {
        it(`invalidates invalid number: ${number}`, () => {
          const result = validatePhoneNumber(number, country);
          expect(result.errorCode?.length).toBeGreaterThan(0);
        });
      });

      it("returns empty for empty input", () => {
        const result = validatePhoneNumber("", country);
        expect(result.errorCode).toEqual("PHONE_NUMBER_TOO_SHORT");
      });

      it("handles whitespace input", () => {
        const result = validatePhoneNumber("   ", country);
        expect(result.errorCode).toEqual("PHONE_NUMBER_TOO_SHORT");
      });
    });
  });
});

// --- validatePostalCode ---
describe("validatePostalCode", () => {
  it("returns undefined for valid postal code", () => {
    expect(validatePostalCode("12345")).toEqual({ errorCode: undefined });
    expect(validatePostalCode("A1B 2C3")).toEqual({ errorCode: undefined });
    expect(validatePostalCode("123-456")).toEqual({ errorCode: undefined });
  });

  it("returns error for empty string", () => {
    expect(validatePostalCode("")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
    expect(validatePostalCode("   ")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
  });

  it("returns error for invalid characters", () => {
    expect(validatePostalCode("123$456")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
    expect(validatePostalCode("!@#")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
  });

  it("returns error for only spaces or hyphens", () => {
    expect(validatePostalCode("   ")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
    expect(validatePostalCode("---")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
    expect(validatePostalCode(" - ")).toEqual({
      errorCode: "INVALID_POSTAL_CODE",
    });
  });

  it("trims input before validation", () => {
    expect(validatePostalCode(" 12345 ")).toEqual({ errorCode: undefined });
  });
});

// --- validateText ---
describe("validateText", () => {
  it("returns TEXT_TOO_SHORT for empty string", () => {
    expect(validateText("")).toEqual({ errorCode: "TEXT_TOO_SHORT" });
    expect(validateText("   ")).toEqual({ errorCode: "TEXT_TOO_SHORT" });
  });

  it("returns TEXT_TOO_LONG for text > 255 chars", () => {
    const longText = "a".repeat(256);
    expect(validateText(longText)).toEqual({ errorCode: "TEXT_TOO_LONG" });
  });

  it("returns undefined for valid text", () => {
    expect(validateText("Hello world")).toEqual({ errorCode: undefined });
    expect(validateText("a".repeat(255))).toEqual({ errorCode: undefined });
  });

  it("trims input before validation", () => {
    expect(validateText("   valid text   ")).toEqual({ errorCode: undefined });
  });
});
