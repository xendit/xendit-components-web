import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePhoneNumber,
  validatePostalCode,
  validateText,
} from "../validation";

import type { CountryCode } from "libphonenumber-js";
import { ChannelFormField } from "../backend-types/channel";
import { computeInputFieldErrorCode } from "../utils";

// Helper mock objects for field types
const mockEmailField = (
  required = false,
): ChannelFormField & { type: { name: "email" } } => ({
  label: "Email",
  placeholder: "Enter email",
  type: { name: "email" },
  channel_property: "email",
  required,
  span: 2,
});

const mockPhoneField = (
  required = false,
): ChannelFormField & { type: { name: "phone_number" } } => ({
  label: "Phone Number",
  placeholder: "Enter phone number",
  type: { name: "phone_number" },
  channel_property: "phone_number",
  required,
  span: 2,
});

const mockPostalCodeField = (
  required = false,
): ChannelFormField & { type: { name: "postal_code" } } => ({
  label: "Postal Code",
  placeholder: "Enter postal code",
  type: { name: "postal_code" },
  channel_property: "postal_code",
  required,
  span: 2,
});

// --- validateEmail ---
describe("validateEmail", () => {
  it("returns undefined for valid email", () => {
    const field = mockEmailField();
    expect(validateEmail(field, "test@example.com")).toBeUndefined();
    expect(validateEmail(field, "user.name+tag@sub.domain.co")).toBeUndefined();
  });

  it("returns error for missing @", () => {
    const field = mockEmailField();
    expect(validateEmail(field, "testexample.com")).toBe(
      "INVALID_EMAIL_FORMAT",
    );
  });

  it("returns error for missing domain", () => {
    const field = mockEmailField();
    expect(validateEmail(field, "test@")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns error for missing TLD", () => {
    const field = mockEmailField();
    expect(validateEmail(field, "test@example")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns error for invalid characters", () => {
    const field = mockEmailField();
    expect(validateEmail(field, "test@exa mple.com")).toBe(
      "INVALID_EMAIL_FORMAT",
    );
    expect(validateEmail(field, "test@.com")).toBe("INVALID_EMAIL_FORMAT");
  });

  it("returns undefined for empty string when not required", () => {
    const field = mockEmailField(false);
    expect(validateEmail(field, "")).toBeUndefined();
  });

  it("returns EMAIL_IS_REQUIRED for empty string when required", () => {
    const field = mockEmailField(true);
    expect(validateEmail(field, "")).toBe("EMAIL_IS_REQUIRED");
  });

  it("trims input before validation", () => {
    const field = mockEmailField();
    expect(validateEmail(field, "  test@example.com ")).toBeUndefined();
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
          const field = mockPhoneField();
          const result = validatePhoneNumber(field, number);
          expect(result).toBeUndefined();
        });
      });

      invalidNumbers[country].forEach((number) => {
        it(`invalidates invalid number: ${number}`, () => {
          const field = mockPhoneField();
          const result = validatePhoneNumber(field, number);
          expect(result).toBe("INVALID_PHONE_NUMBER");
        });
      });

      it("returns PHONE_NUMBER_IS_REQUIRED for empty input when required", () => {
        const field = mockPhoneField(true);
        const result = validatePhoneNumber(field, "");
        expect(result).toBe("PHONE_NUMBER_IS_REQUIRED");
      });

      it("returns undefined for empty input when not required", () => {
        const field = mockPhoneField(false);
        const result = validatePhoneNumber(field, "");
        expect(result).toBeUndefined();
      });

      it("handles whitespace input", () => {
        const field = mockPhoneField(true);
        const result = validatePhoneNumber(field, "   ");
        expect(result).toBe("PHONE_NUMBER_IS_REQUIRED");
      });
    });
  });
});

// --- validatePostalCode ---
describe("validatePostalCode", () => {
  it("returns undefined for valid postal code", () => {
    const field = mockPostalCodeField();
    expect(validatePostalCode(field, "12345")).toBeUndefined();
    expect(validatePostalCode(field, "A1B 2C3")).toBeUndefined();
    expect(validatePostalCode(field, "123-456")).toBeUndefined();
  });

  it("returns POSTAL_CODE_IS_REQUIRED for empty string when required", () => {
    const field = mockPostalCodeField(true);
    expect(validatePostalCode(field, "")).toBe("POSTAL_CODE_IS_REQUIRED");
    expect(validatePostalCode(field, "   ")).toBe("POSTAL_CODE_IS_REQUIRED");
  });

  it("returns undefined for empty string when not required", () => {
    const field = mockPostalCodeField(false);
    expect(validatePostalCode(field, "")).toBeUndefined();
  });

  it("returns error for invalid characters", () => {
    const field = mockPostalCodeField();
    expect(validatePostalCode(field, "123$456")).toBe("INVALID_POSTAL_CODE");
    expect(validatePostalCode(field, "!@#")).toBe("INVALID_POSTAL_CODE");
  });

  it("returns error for only spaces or hyphens", () => {
    const field = mockPostalCodeField();
    expect(validatePostalCode(field, "---")).toBe("INVALID_POSTAL_CODE");
    expect(validatePostalCode(field, " - ")).toBe("INVALID_POSTAL_CODE");
  });

  it("trims input before validation", () => {
    const field = mockPostalCodeField();
    expect(validatePostalCode(field, " 12345 ")).toBeUndefined();
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

  it("returns TEXT_IS_REQUIRED for empty string when required", () => {
    const field = {
      ...baseField,
      required: true,
    };
    expect(validateText(field, "")).toBe(computeInputFieldErrorCode(field));
    expect(validateText(field, "   ")).toBe(computeInputFieldErrorCode(field));
  });

  it("returns undefined for empty string when not required", () => {
    const field = {
      ...baseField,
      required: false,
    };
    expect(validateText(field, "")).toBeUndefined();
  });

  it("returns undefined for valid text within length", () => {
    expect(validateText(baseField, "abcd")).toBeUndefined();
    expect(validateText(baseField, "abcde")).toBeUndefined();
  });

  it("returns TEXT_TOO_SHORT for text shorter than min_length", () => {
    expect(validateText(baseField, "a")).toBe("TEXT_TOO_SHORT");
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
    expect(validateText(field, "ABC")).toBe("Should only be lowercase");
  });

  it("returns TEXT_TOO_SHORT if regex passes but length fails", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
        ],
      },
    };
    expect(validateText(field, "a")).toBe("TEXT_TOO_SHORT");
  });

  it("returns TEXT_TOO_LONG if regex passes but length fails", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        regex_validators: [
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
        ],
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
          { regex: "^[a-z]+$", message: "Should only be lowercase" },
          { regex: "^.{2,}$", message: "Should be at least two characters" },
        ],
      },
    };
    expect(validateText(field, "ab")).toBeUndefined();
    expect(validateText(field, "a")).toBe("Should be at least two characters");
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

  it("returns TEXT_IS_REQUIRED if min_length is not defined and input is empty but required", () => {
    const field = {
      ...baseField,
      type: {
        ...baseField.type,
        min_length: undefined,
      },
    };
    expect(validateText(field, "")).toBe(computeInputFieldErrorCode(field));
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

  it("returns TEXT_IS_REQUIRED for whitespace-only input when required", () => {
    expect(validateText(baseField, "   ")).toBe(
      computeInputFieldErrorCode(baseField),
    );
  });
});
