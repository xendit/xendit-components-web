import { describe, it, expect } from "vitest";
import { getLocalizedErrorMessage, initI18n } from "./localization";
import { ChannelFormField } from "./backend-types/channel";

const i18n = initI18n("en");
const t = i18n.getFixedT("en", "session");

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
