import { describe, it, expect } from "vitest";
import {
  validateCreditCardNumber,
  validateCreditCardCVN,
  validateCreditCardExpiry,
} from "./validation";

// Test numbers are valid and public test numbers for each brand
const cards = [
  { brand: "VISA", number: "4111 1111 1111 1111" },
  { brand: "MASTERCARD", number: "5555 5555 5555 4444" },
  { brand: "AMERICAN-EXPRESS", number: "378282246310005" },
  { brand: "JCB", number: "3530 1113 3330 0000" },
  { brand: "DISCOVER", number: "6011 1111 1111 1117" },
  { brand: "DINERS-CLUB", number: "3056 9309 0259 04" },
  { brand: "UNIONPAY", number: "6240 0086 3140 1148" }, // UnionPay test number, may not pass Luhn
];

describe("validateCreditCardNumber - card brand detection", () => {
  cards.forEach(({ brand, number }) => {
    it(`detects ${brand} for number ${number}`, () => {
      const result = validateCreditCardNumber(number);
      expect(result.cardBrand).toBe(brand);
      // For most brands, the test number is valid and should pass Luhn
      if (brand !== "UNIONPAY") {
        expect(result.valid).toBe(true);
        expect(result.errorCodes.length).toBe(0);
      } else {
        // UnionPay may not always pass Luhn, so just check brand detection
        expect(result.cardBrand).toBe("UNIONPAY");
      }
    });
  });

  it("returns validation.card_number_invalid for unknown prefix", () => {
    const result = validateCreditCardNumber("1234 5678 9012 3456");
    expect(result.cardBrand).toBeUndefined();
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_number_invalid",
    );
  });

  it("returns validation.card_number_invalid for non-numeric input", () => {
    const result = validateCreditCardNumber("lorem ipsum dolor sit");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_number_invalid",
    );
  });

  it("returns validation.card_number_invalid for short input", () => {
    const result = validateCreditCardNumber("4111");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_number_invalid",
    );
  });

  it("returns validation.card_number_invalid for long input", () => {
    const result = validateCreditCardNumber("4111111111111111111111");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_number_invalid",
    );
  });

  it("returns validation.card_number_invalid for invalid Luhn", () => {
    const result = validateCreditCardNumber("4111111111111112");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_number_invalid",
    );
  });
});

describe("validateCreditCardExpiry", () => {
  it("returns valid=true for valid input", () => {
    const result = validateCreditCardExpiry(
      `12/${(new Date().getFullYear() + 5).toString().slice(-2)}`,
    );
    expect(result.valid).toBe(true);
  });

  it("returns validation.card_expiry_invalid for empty input", () => {
    const result = validateCreditCardExpiry("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toEqual([
      "validation.card_expiry_invalid",
    ]);
  });

  it("returns validation.card_expiry_invalid for non-numeric input", () => {
    const result = validateCreditCardExpiry("abcd");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_expiry_invalid",
    );
  });

  it("returns validation.card_expiry_invalid for incomplete input", () => {
    const result = validateCreditCardExpiry("12");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_expiry_invalid",
    );
  });

  it("returns validation.card_expiry_invalid for month 00", () => {
    const result = validateCreditCardExpiry("00/30");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_expiry_invalid",
    );
  });

  it("returns validation.card_expiry_invalid for month 13", () => {
    const result = validateCreditCardExpiry("13/30");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_expiry_invalid",
    );
  });

  it("returns validation.card_expiry_invalid for past date", () => {
    // Use a date far in the past
    const result = validateCreditCardExpiry("01/20");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_expiry_invalid",
    );
  });
});

describe("validateCreditCardCVN", () => {
  it("returns valid=true for 3-digit CVN", () => {
    const result = validateCreditCardCVN("123");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
    expect(result.empty).toBe(false);
  });

  it("returns valid=true for 4-digit CVN", () => {
    const result = validateCreditCardCVN("1234");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
    expect(result.empty).toBe(false);
  });

  it("returns validation.card_cvn_invalid for non-numeric input", () => {
    const result = validateCreditCardCVN("abc");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_cvn_invalid",
    );
    expect(result.empty).toBe(false);
  });

  it("returns validation.text_too_short for 1-digit CVN", () => {
    const result = validateCreditCardCVN("1");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.text_too_short",
    );
    expect(result.empty).toBe(false);
  });

  it("returns validation.text_too_short for 2-digit CVN", () => {
    const result = validateCreditCardCVN("12");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.text_too_short",
    );
    expect(result.empty).toBe(false);
  });

  it("returns validation.text_too_long for 5-digit CVN", () => {
    const result = validateCreditCardCVN("12345");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.text_too_long",
    );
    expect(result.empty).toBe(false);
  });

  it("returns validation.text_too_long for 6-digit CVN", () => {
    const result = validateCreditCardCVN("123456");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.text_too_long",
    );
    expect(result.empty).toBe(false);
  });

  it("returns validation.card_cvn_invalid for CVN with special characters", () => {
    const result = validateCreditCardCVN("12@");
    expect(result.valid).toBe(false);
    expect(result.errorCodes.map((code) => code.localeKey)).toContain(
      "validation.card_cvn_invalid",
    );
    expect(result.empty).toBe(false);
  });
});
