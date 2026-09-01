import { describe, it, expect } from "vitest";
import {
  createTFunction,
  getLocalizedErrorMessage,
  InterceptLocaleStringsFn,
} from "./localization";
import { ChannelFormField } from "./backend-types/channel";

const t = createTFunction("en", undefined);

describe("t", () => {
  it("returns localized string for a valid key", () => {
    expect(t("validation.card_cvn_invalid")).toBe("CVN is not valid");
  });
  it("returns localized string for a valid key with interpolation", () => {
    expect(t("validation.required", { field: "Email" })).toBe(
      "Email is required.",
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

describe("createTFunction with interceptLocaleStrings", () => {
  it("returns original locale string when interceptor is undefined", () => {
    const tFn = createTFunction("en", undefined);
    expect(tFn("validation.card_cvn_invalid")).toBe("CVN is not valid");
  });

  it("allows interceptor to override locale strings", () => {
    const interceptor: InterceptLocaleStringsFn = (strings) => ({
      ...strings,
      "validation.card_cvn_invalid": "Custom CVN error message",
    });
    const tFn = createTFunction("en", interceptor);
    expect(tFn("validation.card_cvn_invalid")).toBe("Custom CVN error message");
  });

  it("preserves unmodified strings when interceptor overrides specific keys", () => {
    const interceptor: InterceptLocaleStringsFn = (strings) => ({
      ...strings,
      "validation.card_cvn_invalid": "Custom CVN error",
    });
    const tFn = createTFunction("en", interceptor);
    // Check that a different key still uses the original string
    expect(tFn("validation.required", { field: "Email" })).toBe(
      "Email is required.",
    );
  });

  it("supports interpolation with intercepted strings", () => {
    const interceptor: InterceptLocaleStringsFn = (strings) => ({
      ...strings,
      "validation.required": "{{field}} cannot be empty",
    });
    const tFn = createTFunction("en", interceptor);
    expect(tFn("validation.required", { field: "Name" })).toBe(
      "Name cannot be empty",
    );
  });

  it("works with non-English locales", () => {
    const interceptor: InterceptLocaleStringsFn = (strings) => ({
      ...strings,
      "validation.card_cvn_invalid": "CVN tidak valid (custom)",
    });
    const tFn = createTFunction("id", interceptor);
    expect(tFn("validation.card_cvn_invalid")).toBe("CVN tidak valid (custom)");
  });

  it("allows interceptor to return completely new locale data", () => {
    const interceptor: InterceptLocaleStringsFn = () => ({
      "validation.card_cvn_invalid": "Completely new message",
    });
    const tFn = createTFunction("en", interceptor);
    expect(tFn("validation.card_cvn_invalid")).toBe("Completely new message");
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
    expect(result).toBe("Email is required.");
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
