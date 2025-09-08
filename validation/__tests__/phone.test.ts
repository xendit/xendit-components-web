import { describe, it, expect } from "vitest";
import { validatePhoneNumber } from "../phone";
import type { CountryCode } from "libphonenumber-js";

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

describe("validatePhoneNumber", () => {
  countries.forEach((country) => {
    describe(`Country: ${country}`, () => {
      validNumbers[country].forEach((number) => {
        it(`validates valid number: ${number}`, () => {
          const result = validatePhoneNumber(number, country);
          expect(result.valid).toBe(true);
          expect(result.errorCodes).toEqual([]);
        });
      });

      invalidNumbers[country].forEach((number) => {
        it(`invalidates invalid number: ${number}`, () => {
          const result = validatePhoneNumber(number, country);
          expect(result.valid).toBe(false);
          expect(result.errorCodes.length).toBeGreaterThan(0);
        });
      });

      it("returns empty for empty input", () => {
        const result = validatePhoneNumber("", country);
        expect(result.empty).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.errorCodes).toEqual([]);
      });

      it("handles whitespace input", () => {
        const result = validatePhoneNumber("   ", country);
        expect(result.empty).toBe(true);
        expect(result.valid).toBe(true);
        expect(result.errorCodes).toEqual([]);
      });
    });
  });
});
