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
      {
        localeKey: "validation.required",
      },
      mockField,
      "en",
    );
    expect(result).toBe("Email is required");
  });

  it("returns localized required message in Indonesian", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.required",
      },
      mockField,
      "id",
    );
    expect(result).toBe("Email wajib diisi");
  });

  it("returns localized required message in Thai", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.required",
      },
      mockField,
      "th",
    );
    expect(result).toBe("กรุณากรอก Email");
  });

  it("returns localized required message in Vietnamese", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.required",
      },
      mockField,
      "vi",
    );
    expect(result).toBe("Vui lòng nhập Email");
  });

  it("returns localized generic invalid message in English", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.generic_invalid",
      },
      mockField,
      "en",
    );
    expect(result).toBe("Email is not valid");
  });

  it("returns localized invalid phone number message in English", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.generic_invalid",
      },
      mockField,
      "en",
    );
    expect(result).toBe("Email is not valid");
  });

  it("returns localized invalid postal code message in English", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.generic_invalid",
      },
      mockField,
      "en",
    );
    expect(result).toBe("Email is not valid");
  });

  it("returns localized text too long message", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.text_too_long",
      },
      mockField,
      "en",
    );
    expect(result).toBe("Email is too long");
  });

  it("returns custom regex message as-is", () => {
    const customMessage = "This is a LocalizedString validation message";
    const result = getLocalizedErrorMessage(
      {
        value: customMessage,
      },
      mockField,
      "en",
    );
    expect(result).toBe(customMessage);
  });

  it("fallback to English when locale is not supported", () => {
    const result = getLocalizedErrorMessage(
      {
        localeKey: "validation.required",
      },
      mockField,
      "fr",
    );
    expect(result).toBe("Email is required");
  });
});
