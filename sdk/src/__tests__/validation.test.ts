import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
  validateText,
} from "../validation";

import type { CountryCode } from "libphonenumber-js";
import { ChannelFormField } from "../backend-types/channel";

// --- validateEmail ---
describe("validateEmail", () => {
  it("returns undefined for valid email", () => {
    expect(validateEmail("test@example.com")).toBeUndefined();
    expect(validateEmail("user.name+tag@sub.domain.co")).toBeUndefined();
  });

  it("returns error for missing @", () => {
    expect(validateEmail("testexample.com")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns error for missing domain", () => {
    expect(validateEmail("test@")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns error for missing TLD", () => {
    expect(validateEmail("test@example")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns error for invalid characters", () => {
    expect(validateEmail("test@exa mple.com")).toBe("INVALID_EMAIL_FORMAT");
    expect(validateEmail("test@.com")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns undefined for empty string", () => {
    expect(validateEmail("")).toBeUndefined();
  });

  it("trims input before validation", () => {
    expect(validateEmail("  test@example.com ")).toBeUndefined();
  });
});

const countries: CountryCode[] = ["ID", "MY", "PH", "SG", "TH", "VN"];

const validNumbers: Record<string, string[]> = {
  ID: ["+628123456789"],
  MY: ["+60123456789"],
  PH: ["+639171234567"],
  SG: ["+6581234567"],
  TH: ["+66812345678"],
  VN: ["+84901234567"],
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
          const result = validatePhoneNumber(number);
          expect(result).toBeUndefined();
        });
      });

      invalidNumbers[country].forEach((number) => {
        it(`invalidates invalid number: ${number}`, () => {
          const result = validatePhoneNumber(number);
          expect(result).toBe("INVALID_PHONE_NUMBER");
        });
      });

      it("returns error for empty input", () => {
        const result = validatePhoneNumber("");
        expect(result).toBe("INVALID_PHONE_NUMBER");
      });

      it("handles whitespace input", () => {
        const result = validatePhoneNumber("   ");
        expect(result).toBe("INVALID_PHONE_NUMBER");
      });
    });
  });
});

// --- validatePostalCode ---
describe("validatePostalCode", () => {
  it("returns undefined for valid postal code", () => {
    expect(validatePostalCode("12345")).toBeUndefined();
    expect(validatePostalCode("A1B 2C3")).toBeUndefined();
    expect(validatePostalCode("123-456")).toBeUndefined();
  });

  it("returns error for empty string", () => {
    expect(validatePostalCode("")).toBe("INVALID_POSTAL_CODE");
    expect(validatePostalCode("   ")).toBe("INVALID_POSTAL_CODE");
  });

  it("returns error for invalid characters", () => {
    expect(validatePostalCode("123$456")).toBe("INVALID_POSTAL_CODE");
    expect(validatePostalCode("!@#")).toBe("INVALID_POSTAL_CODE");
  });

  it("returns error for only spaces or hyphens", () => {
    expect(validatePostalCode("   ")).toBe("INVALID_POSTAL_CODE");
    expect(validatePostalCode("---")).toBe("INVALID_POSTAL_CODE");
    expect(validatePostalCode(" - ")).toBe("INVALID_POSTAL_CODE");
  });

  it("trims input before validation", () => {
    expect(validatePostalCode(" 12345 ")).toBeUndefined();
  });
});

// --- validateText ---
describe("validateText", () => {
  const baseField: ChannelFormField & {
    type: { name: "text" };
  } = {
    required: true,
    type: {
      name: "text",
      min_length: 2,
      max_length: 5,
      regex_validators: [],
    },
    channel_property: "test_property",
    placeholder: "Enter text",
    span: 2,
    label: "Test Field",
  };

  it("returns undefined for valid text within length", () => {
    expect(validateText(baseField, "abcd")).toBeUndefined();
    expect(validateText(baseField, "abcde")).toBeUndefined();
  });

  it("returns TEXT_TOO_SHORT for text shorter than min_length", () => {
    expect(validateText(baseField, "a")).toBe("TEXT_TOO_SHORT");
    expect(validateText(baseField, "")).toBe("TEXT_TOO_SHORT");
    expect(validateText(baseField, " ")).toBe("TEXT_TOO_SHORT");
  });

  it("returns TEXT_TOO_LONG for text longer than max_length", () => {
    expect(validateText(baseField, "abcdef")).toBe("TEXT_TOO_LONG");
  });

  it("trims input before length validation", () => {
    expect(validateText(baseField, " abcd ")).toBeUndefined();
    expect(validateText(baseField, " a ")).toBe("TEXT_TOO_SHORT");
    expect(validateText(baseField, " abcdef ")).toBe("TEXT_TOO_LONG");
  });

  it("returns undefined if regex_validators pass", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [{ regex: "^[a-z]+$", message: "ONLY_LOWERCASE" }],
      },
    };
    expect(validateText(field, "abc")).toBeUndefined();
  });

  it("does not set errorCode for regex_validators failure (returns undefined)", () => {
    // Note: The implementation does not set errorCode for regex failure, only returns pattern.message from .every
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [{ regex: "^[a-z]+$", message: "ONLY_LOWERCASE" }],
      },
    };
    expect(validateText(field, "ABC")).toBeUndefined();
  });

  it("returns TEXT_TOO_SHORT if regex passes but length fails", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [{ regex: "^[a-z]+$", message: "ONLY_LOWERCASE" }],
      },
    };
    expect(validateText(field, "a")).toBe("TEXT_TOO_SHORT");
  });

  it("returns TEXT_TOO_LONG if regex passes but length fails", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [{ regex: "^[a-z]+$", message: "ONLY_LOWERCASE" }],
      },
    };
    expect(validateText(field, "abcdef")).toBe("TEXT_TOO_LONG");
  });

  it("handles multiple regex_validators", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "ONLY_LOWERCASE" },
          { regex: "^.{2,}$", message: "MIN_TWO_CHARS" },
        ],
      },
    };
    expect(validateText(field, "ab")).toBeUndefined();
    expect(validateText(field, "a")).toBe("TEXT_TOO_SHORT");
  });

  it("returns undefined if no regex_validators and valid length", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: undefined,
      },
    };
    expect(validateText(field, "abcd")).toBeUndefined();
  });

  it("returns TEXT_TOO_SHORT if min_length is not defined and input is empty", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        min_length: undefined,
      },
    };
    expect(validateText(field, "")).toBe("TEXT_TOO_SHORT");
  });

  it("returns TEXT_TOO_LONG if max_length is exceeded", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        max_length: 3,
      },
    };
    expect(validateText(field, "abcd")).toBe("TEXT_TOO_LONG");
  });

  it("returns undefined for exact min_length and max_length", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        min_length: 2,
        max_length: 4,
      },
    };
    expect(validateText(field, "ab")).toBeUndefined();
    expect(validateText(field, "abcd")).toBeUndefined();
  });

  it("returns TEXT_TOO_SHORT for whitespace-only input", () => {
    expect(validateText(baseField, "   ")).toBe("TEXT_TOO_SHORT");
  });
});
