import { describe, it, expect } from "vitest";
import { getLocalizedErrorMessage } from "../localization";
import { ChannelFormField } from "../backend-types/channel";

describe("getLocalizedErrorMessage", () => {
  const mockField: ChannelFormField = {
    label: "Email",
    placeholder: "Enter your email",
    required: true,
    type: { name: "email" },
    channel_property: "email",
    span: 2,
  };

  it("returns localized required message in English", () => {
    const result = getLocalizedErrorMessage(
      "FIELD_IS_REQUIRED",
      mockField,
      "en",
    );
    expect(result).toBe("Email is required");
  });

  it("returns localized required message in Indonesian", () => {
    const result = getLocalizedErrorMessage(
      "FIELD_IS_REQUIRED",
      mockField,
      "id",
    );
    expect(result).toBe("Email wajib diisi");
  });

  it("returns localized required message in Thai", () => {
    const result = getLocalizedErrorMessage(
      "FIELD_IS_REQUIRED",
      mockField,
      "th",
    );
    expect(result).toBe("กรุณากรอก Email");
  });

  it("returns localized required message in Vietnamese", () => {
    const result = getLocalizedErrorMessage(
      "FIELD_IS_REQUIRED",
      mockField,
      "vi",
    );
    expect(result).toBe("Vui lòng nhập Email");
  });

  it("returns localized generic invalid message in English", () => {
    const result = getLocalizedErrorMessage(
      "INVALID_EMAIL_FORMAT",
      mockField,
      "en",
    );
    expect(result).toBe("Email is not valid");
  });

  it("returns localized invalid phone number message in English", () => {
    const result = getLocalizedErrorMessage(
      "INVALID_PHONE_NUMBER",
      mockField,
      "en",
    );
    expect(result).toBe("Email is not valid");
  });

  it("returns localized invalid postal code message in English", () => {
    const result = getLocalizedErrorMessage(
      "INVALID_POSTAL_CODE",
      mockField,
      "en",
    );
    expect(result).toBe("Email is not valid");
  });

  it("returns localized text too long message", () => {
    const result = getLocalizedErrorMessage("TEXT_TOO_LONG", mockField, "en");
    expect(result).toBe("Email is too long");
  });

  it("returns null for null error code", () => {
    const result = getLocalizedErrorMessage(null, mockField, "en");
    expect(result).toBe(null);
  });

  it("returns custom regex message as-is", () => {
    const customMessage = "This is a custom validation message";
    const result = getLocalizedErrorMessage(customMessage, mockField, "en");
    expect(result).toBe(customMessage);
  });

  it("fallback to English when locale is not supported", () => {
    const result = getLocalizedErrorMessage(
      "FIELD_IS_REQUIRED",
      mockField,
      "fr",
    );
    expect(result).toBe("Email is required");
  });
});
