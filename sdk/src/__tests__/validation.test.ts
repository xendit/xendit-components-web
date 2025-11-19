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
    expect(validateEmail("testexample.com")?.localeKey).toBe(
      "validation.generic_invalid",
    );
  });

  it("returns error for missing domain", () => {
    expect(validateEmail("test@")?.localeKey).toBe(
      "validation.generic_invalid",
    );
  });

  it("returns error for missing TLD", () => {
    expect(validateEmail("test@example")?.localeKey).toBe(
      "validation.generic_invalid",
    );
  });

  it("returns error for invalid characters", () => {
    expect(validateEmail("test@exa mple.com")?.localeKey).toBe(
      "validation.generic_invalid",
    );
    expect(validateEmail("test@.com")?.localeKey).toBe(
      "validation.generic_invalid",
    );
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
          expect(result?.localeKey).toBe("validation.generic_invalid");
        });
      });

      it("returns error for empty input", () => {
        const result = validatePhoneNumber("");
        expect(result?.localeKey).toBe("validation.generic_invalid");
      });

      it("handles whitespace input", () => {
        const result = validatePhoneNumber("   ");
        expect(result?.localeKey).toBe("validation.generic_invalid");
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
    expect(validatePostalCode("")?.localeKey).toBe(
      "validation.generic_invalid",
    );
    expect(validatePostalCode("   ")?.localeKey).toBe(
      "validation.generic_invalid",
    );
  });

  it("returns error for invalid characters", () => {
    expect(validatePostalCode("123$456")?.localeKey).toBe(
      "validation.generic_invalid",
    );
    expect(validatePostalCode("!@#")?.localeKey).toBe(
      "validation.generic_invalid",
    );
  });

  it("returns error for only spaces or hyphens", () => {
    expect(validatePostalCode("   ")?.localeKey).toBe(
      "validation.generic_invalid",
    );
    expect(validatePostalCode("---")?.localeKey).toBe(
      "validation.generic_invalid",
    );
    expect(validatePostalCode(" - ")?.localeKey).toBe(
      "validation.generic_invalid",
    );
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

  it("returns validation.text_too_short for text shorter than min_length", () => {
    expect(validateText(baseField, "a")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
    expect(validateText(baseField, "")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
    expect(validateText(baseField, " ")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
  });

  it("returns validation.text_too_long for text longer than max_length", () => {
    expect(validateText(baseField, "abcdef")).toStrictEqual({
      localeKey: "validation.text_too_long",
    });
  });

  it("trims input before length validation", () => {
    expect(validateText(baseField, " abcd ")).toBeUndefined();
    expect(validateText(baseField, " a ")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
    expect(validateText(baseField, " abcdef ")).toStrictEqual({
      localeKey: "validation.text_too_long",
    });
  });

  it("returns undefined if regex_validators pass", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
        ],
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
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
        ],
      },
    };
    expect(validateText(field, "ABC")).toStrictEqual({
      value: "Should only be lowercase",
    });
  });

  it("returns validation.text_too_short if regex passes but length fails", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
        ],
      },
    };
    expect(validateText(field, "a")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
  });

  it("returns validation.text_too_long if regex passes but length fails", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
        ],
      },
    };
    expect(validateText(field, "abcdef")).toStrictEqual({
      localeKey: "validation.text_too_long",
    });
  });

  it("handles multiple regex_validators", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
          { regex: "^.{2,}$", message: "Should be at least two characters" },
        ],
      },
    };
    expect(validateText(field, "ab")).toBeUndefined();
    expect(validateText(field, "a")).toStrictEqual({
      value: "Should be at least two characters",
    });
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

  it("returns validation.text_too_short if min_length is not defined and input is empty", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        min_length: undefined,
      },
    };
    expect(validateText(field, "")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
  });

  it("returns validation.text_too_long if max_length is exceeded", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        max_length: 3,
      },
    };
    expect(validateText(field, "abcd")).toStrictEqual({
      localeKey: "validation.text_too_long",
    });
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

  it("returns validation.text_too_short for whitespace-only input", () => {
    expect(validateText(baseField, "   ")).toStrictEqual({
      localeKey: "validation.text_too_short",
    });
  });
});
