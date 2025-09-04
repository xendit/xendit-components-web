import {
  validateCreditCardNumber,
  validateCreditCardCVN,
  validateCreditCardExpiry,
} from "../../validation/card";

describe("validateCreditCardNumber", () => {
  test("should return empty for empty input", () => {
    const result = validateCreditCardNumber("");
    expect(result.empty).toBe(true);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_TOO_SHORT");
  });

  test("should detect Visa and validate a correct number", () => {
    const result = validateCreditCardNumber("4111 1111 1111 1111");
    expect(result.cardBrand).toBe("VISA");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should detect MasterCard and validate a correct number", () => {
    const result = validateCreditCardNumber("5555 5555 5555 4444");
    expect(result.cardBrand).toBe("MASTERCARD");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should detect Amex and validate a correct number", () => {
    const result = validateCreditCardNumber("378282246310005");
    expect(result.cardBrand).toBe("AMEX");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should detect JCB and validate a correct number", () => {
    const result = validateCreditCardNumber("3530111333300000");
    expect(result.cardBrand).toBe("JCB");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should detect Discover and validate a correct number", () => {
    const result = validateCreditCardNumber("6011111111111117");
    expect(result.cardBrand).toBe("DISCOVER");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should detect Diners and validate a correct number", () => {
    const result = validateCreditCardNumber("30569309025904");
    expect(result.cardBrand).toBe("DINERS");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should detect UnionPay and validate a correct number", () => {
    const result = validateCreditCardNumber("6240008631401148");
    expect(result.cardBrand).toBe("UNIONPAY");
    expect(result.cardBrand).toBe("UNIONPAY");
  });

  test("should return NOT_A_NUMBER for non-numeric input", () => {
    const result = validateCreditCardNumber("abcd efgh ijkl mnop");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("NOT_A_NUMBER");
  });

  test("should return CREDIT_CARD_NUMBER_TOO_SHORT for short input", () => {
    const result = validateCreditCardNumber("4111");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_TOO_SHORT");
  });

  test("should return CREDIT_CARD_NUMBER_TOO_LONG for long input", () => {
    const result = validateCreditCardNumber("4111111111111111111111");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_TOO_LONG");
  });

  test("should return CREDIT_CARD_NUMBER_LUHN for invalid Luhn", () => {
    const result = validateCreditCardNumber("4111111111111112");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_NUMBER_LUHN");
  });
});

describe("validateCreditCardCVN", () => {
  test("should validate 3-digit CVN", () => {
    const result = validateCreditCardCVN("123");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should validate 4-digit CVN", () => {
    const result = validateCreditCardCVN("1234");
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should return CREDIT_CARD_CVN_TOO_SHORT for short CVN", () => {
    const result = validateCreditCardCVN("12");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_CVN_TOO_SHORT");
  });

  test("should return CREDIT_CARD_CVN_TOO_LONG for long CVN", () => {
    const result = validateCreditCardCVN("12345");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_CVN_TOO_LONG");
  });

  test("should return NOT_A_NUMBER for non-numeric CVN", () => {
    const result = validateCreditCardCVN("12a");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("NOT_A_NUMBER");
  });
});

describe("validateCreditCardExpiry", () => {
  test("should validate correct expiry", () => {
    const now = new Date();
    const year = (now.getFullYear() + 1) % 100;
    const month = now.getMonth() + 1;
    const expiry = `${month.toString().padStart(2, "0")}/${year
      .toString()
      .padStart(2, "0")}`;
    const result = validateCreditCardExpiry(expiry);
    expect(result.valid).toBe(true);
    expect(result.errorCodes.length).toBe(0);
  });

  test("should return CREDIT_CARD_EXPIRY_INVALID_FORMAT for wrong format", () => {
    const result = validateCreditCardExpiry("1225");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_INVALID_FORMAT");
  });

  test("should return CREDIT_CARD_EXPIRY_INVALID_DATE for invalid month", () => {
    const result = validateCreditCardExpiry("13/25");
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_INVALID_DATE");
  });

  test("should return CREDIT_CARD_EXPIRY_IN_PAST for past expiry", () => {
    const now = new Date();
    const year = (now.getFullYear() - 1) % 100;
    const month = now.getMonth() + 1;
    const expiry = `${month.toString().padStart(2, "0")}/${year
      .toString()
      .padStart(2, "0")}`;
    const result = validateCreditCardExpiry(expiry);
    expect(result.valid).toBe(false);
    expect(result.errorCodes).toContain("CREDIT_CARD_EXPIRY_IN_PAST");
  });
});
