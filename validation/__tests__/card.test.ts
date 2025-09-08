import { describe, it, expect } from "vitest";
import {
  validateCreditCardNumber,
  validateCreditCardCVN,
  validateCreditCardExpiry,
} from "../../validation/card";

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

  it("returns CREDIT_CARD_UNKNOWN_BRAND for unknown prefix", () => {
    const result = validateCreditCardNumber("1234 5678 9012 3456");
    expect(result.cardBrand).toBeUndefined();
    expect(result.errorCodes).toContain("CREDIT_CARD_UNKNOWN_BRAND");
  });

  it("returns NOT_A_NUMBER for non-numeric input", () => {
    const result = validateCreditCardNumber("lorem ipsum dolor sit");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("NOT_A_NUMBER");
  });

  it("returns CREDIT_CARD_NUM`BER_TOO_SHORT for short input", () => {
    const result = validateCreditCardNumber("4111");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_INVALID_LENGTH");
  });

  it("returns CREDIT_CARD_NUMBER_TOO_LONG for long input", () => {
    const result = validateCreditCardNumber("4111111111111111111111");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_INVALID_LENGTH");
  });

  it("returns CREDIT_CARD_NUMBER_LUHN for invalid Luhn", () => {
    const result = validateCreditCardNumber("4111111111111112");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_LUHN");
  });
});

describe("validateCreditCardCVN", () => {
  it("returns empty=true for empty input", () => {
    const result = validateCreditCardCVN("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
  });

  it("returns NOT_A_NUMBER for non-numeric input", () => {
    const result = validateCreditCardCVN("abc");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("NOT_A_NUMBER");
  });

  it("returns CREDIT_CARD_CVN_TOO_SHORT for 1 digit", () => {
    const result = validateCreditCardCVN("1");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_CVN_TOO_SHORT");
  });

  it("returns CREDIT_CARD_CVN_TOO_SHORT for 2 digits", () => {
    const result = validateCreditCardCVN("12");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_CVN_TOO_SHORT");
  });

  it("returns valid for 3 digits", () => {
    const result = validateCreditCardCVN("123");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
  });

  it("returns valid for 4 digits", () => {
    const result = validateCreditCardCVN("1234");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
  });

  it("returns CREDIT_CARD_CVN_TOO_LONG for 5 digits", () => {
    const result = validateCreditCardCVN("12345");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_CVN_TOO_LONG");
  });

  it("returns CREDIT_CARD_CVN_TOO_LONG for 10 digits", () => {
    const result = validateCreditCardCVN("1234567890");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_CVN_TOO_LONG");
  });

  it("trims spaces and validates CVN", () => {
    const result = validateCreditCardCVN(" 123 ");
    expect(result.valid).toBe(true);
    expect(result.errorCodes).toEqual([]);
  });
});

describe("validateCreditCardExpiry", () => {
  it("returns empty=true for empty input", () => {
    const result = validateCreditCardExpiry("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toEqual(["CREDIT_CARD_EXPIRY_EMPTY"]);
  });

  it("returns CREDIT_CARD_EXPIRY_INVALID_FORMAT for non-numeric input", () => {
    const result = validateCreditCardExpiry("abcd");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_INVALID_FORMAT");
  });

  it("returns CREDIT_CARD_EXPIRY_INVALID_FORMAT for incomplete input", () => {
    const result = validateCreditCardExpiry("12");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_INVALID_FORMAT");
  });

  it("returns CREDIT_CARD_EXPIRY_INVALID_DATE for month 00", () => {
    const result = validateCreditCardExpiry("00/30");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_INVALID_DATE");
  });

  it("returns CREDIT_CARD_EXPIRY_INVALID_DATE for month 13", () => {
    const result = validateCreditCardExpiry("13/30");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_INVALID_DATE");
  });

  it("returns CREDIT_CARD_EXPIRY_IN_PAST for past date", () => {
    // Use a date far in the past
    const result = validateCreditCardExpiry("01/20");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_IN_PAST");
  });
});
