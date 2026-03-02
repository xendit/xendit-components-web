import { describe, it, expect } from "vitest";
import { createTFunction, getLocalizedErrorMessage } from "./localization";
import { ChannelFormField } from "./backend-types/channel";

const t = createTFunction("en");

describe("t", () => {
  it("returns localized string for a valid key", () => {
    expect(t("validation.card_cvn_invalid")).toBe("CVN is not valid");
  });
  it("returns localized string for a valid key with interpolation", () => {
    expect(t("validation.required", { field: "Email" })).toBe(
      "Email is required",
    );
  });
  it("returns localized string with fallback", () => {
    // @ts-expect-error testing fallback behavior with invalid key
    expect(t("nonexistant_key", "Fallback")).toBe("Fallback");
  });
  it("returns localized string with interpolation and fallback", () => {
    expect(
      // @ts-expect-error testing fallback behavior with invalid key
      t("nonexistant_key", "Fallback with {{interpolation}}", {
        interpolation: 1,
      }),
    ).toBe("Fallback with 1");
  });
});

describe("getLocalizedErrorMessage", () => {
  const mockField: ChannelFormField = {
    label: "Email",
    placeholder: "Enter your email",
    required: true,
    type: { name: "email" },
    channel_property: "email",
    span: 2,
  };

  it("returns localized message without placeholder", () => {
    const result = getLocalizedErrorMessage(
      t,
      {
        localeKey: "validation.card_cvn_invalid",
      },
      mockField,
    );
    expect(result).toBe("CVN is not valid");
  });

  it("returns localized message with placeholder", () => {
    const result = getLocalizedErrorMessage(
      t,
      {
        localeKey: "validation.required",
      },
      mockField,
    );
    expect(result).toBe("Email is required");
  });

  it("returns pre-localized string as-is", () => {
    const result = getLocalizedErrorMessage(
      t,
      {
        value: "This is a string",
      },
      mockField,
    );
    expect(result).toBe("This is a string");
  });
});
