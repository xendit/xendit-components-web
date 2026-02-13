import { describe, expect, it } from "vitest";
import { BffChannel, ChannelFormField } from "./backend-types/channel";
import {
  channelPropertiesAreValid,
  channelPropertyFieldValidate,
} from "./validation";

function makeField(
  channelProperty: string,
  fieldType: ChannelFormField["type"],
): ChannelFormField {
  return {
    label: "encrypted field",
    channel_property: channelProperty,
    type: fieldType,
    required: false,
    placeholder: "encrypted field",
    span: 2,
  };
}

const encryptedField = makeField("encrypted_field", {
  name: "credit_card_number",
});

const textField = makeField("text", {
  name: "text",
  max_length: 10,
  min_length: 2,
  regex_validators: [
    {
      message: "error message from regex rule",
      regex: "^[a-zA-Z -]+$",
    },
    {
      message: "error message with regex rule with slashes",
      regex: "/^[^Q]+$/",
    },
  ],
});

const emailField = makeField("email", {
  name: "email",
});

const postalCodeField = makeField("postal_code", {
  name: "postal_code",
});

const phoneNumberField = makeField("phone_number", {
  name: "phone_number",
});

const requiredField = makeField("required", {
  name: "text",
  max_length: 10,
});
requiredField.required = true;

const noValidationField = makeField("no_validation", {
  name: "country",
});

function channelWithForm(form: ChannelFormField[]): BffChannel {
  return {
    brand_name: "Mock channel",
    channel_code: "MOCK_CHANNEL",
    brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
    ui_group: "other",
    allow_pay_without_save: false,
    allow_save: false,
    brand_color: "#000000",
    min_amount: 1,
    max_amount: 100000000,
    requires_customer_details: false,
    _mock_action_type: "REDIRECT",
    form,
    instructions: [],
  };
}

describe("validation", () => {
  it("should validate encrypted fields", () => {
    // valid
    const props1 = {
      encrypted_field: "xendit-encrypted-1-PUBLICKEY-IV-CIPHERTEXT",
    };
    expect(channelPropertyFieldValidate(encryptedField, props1)).toBe(
      undefined,
    );

    // embedded error message
    const props2 = {
      encrypted_field: `xendit-encrypted-1-PUBLICKEY-IV-CIPHERTEXT-invalid-${btoa("validation.card_expiry_invalid")}`,
    };
    expect(channelPropertyFieldValidate(encryptedField, props2)).toEqual({
      localeKey: "validation.card_expiry_invalid",
    });

    // unexpected format (wrong prefix)
    const props3 = {
      encrypted_field: `junk`,
    };
    expect(() =>
      channelPropertyFieldValidate(encryptedField, props3),
    ).toThrow();

    // unexpected formats (wrong number of parts)
    const props4 = {
      encrypted_field: `xendit-encrypted-1-PUBLICKEY-IV`,
    };
    expect(() =>
      channelPropertyFieldValidate(encryptedField, props4),
    ).toThrow();
  });

  it("should validate text fields", () => {
    // valid
    const props1 = {
      text: "valid",
    };
    expect(channelPropertyFieldValidate(textField, props1)).toBe(undefined);

    // too long
    const props2 = {
      text: "too long too long",
    };
    expect(channelPropertyFieldValidate(textField, props2)).toEqual({
      localeKey: "validation.text_too_long",
    });

    // too short
    const props3 = {
      text: "a",
    };
    expect(channelPropertyFieldValidate(textField, props3)).toEqual({
      localeKey: "validation.text_too_short",
    });

    // fail regex rule
    const props4 = {
      text: "1234",
    };
    expect(channelPropertyFieldValidate(textField, props4)).toEqual({
      value: "error message from regex rule",
    });

    // fail regex rule with slashes
    const props5 = {
      text: "Q",
    };
    expect(channelPropertyFieldValidate(textField, props5)).toEqual({
      value: "error message with regex rule with slashes",
    });
  });

  it("should validate email fields", () => {
    // valid
    const props1 = {
      email: "test@test.com",
    };
    expect(channelPropertyFieldValidate(emailField, props1)).toBe(undefined);

    // invalid
    const props2 = {
      email: "not-an-email",
    };
    expect(channelPropertyFieldValidate(emailField, props2)).toEqual({
      localeKey: "validation.generic_invalid",
    });
  });

  it("should validate postal code", () => {
    // valid
    const props1 = {
      postal_code: "12345",
    };
    expect(channelPropertyFieldValidate(postalCodeField, props1)).toBe(
      undefined,
    );

    // invalid
    const props2 = {
      postal_code: "invalid-postal-code!",
    };
    expect(channelPropertyFieldValidate(postalCodeField, props2)).toEqual({
      localeKey: "validation.generic_invalid",
    });
  });

  it("should validate phone number", () => {
    // valid
    const props1 = {
      phone_number: "+6581234567",
    };
    expect(channelPropertyFieldValidate(phoneNumberField, props1)).toBe(
      undefined,
    );

    // invalid
    const props2 = {
      phone_number: "zzzzzzzz",
    };
    expect(channelPropertyFieldValidate(phoneNumberField, props2)).toEqual({
      localeKey: "validation.generic_invalid",
    });
  });

  it("should validate unvalidated field", () => {
    // valid
    const props1 = {
      no_validation: "any value",
    };
    expect(channelPropertyFieldValidate(noValidationField, props1)).toBe(
      undefined,
    );
  });

  it("should validate required field", () => {
    // valid
    const props1 = {
      required: "some value",
    };
    expect(channelPropertyFieldValidate(requiredField, props1)).toBe(undefined);

    // valid
    const props2 = {};
    expect(channelPropertyFieldValidate(requiredField, props2)).toEqual({
      localeKey: "validation.required",
    });
  });

  it("should validate all fields together", () => {
    // valid
    const props1 = {
      required: "some value",
      text: "valid",
    };
    const channel = channelWithForm([textField, requiredField]);
    expect(channelPropertiesAreValid("PAY", channel, props1, null)).toBe(true);

    // null is also treated as empty
    const channel2 = channelWithForm([textField]);
    expect(channelPropertiesAreValid("PAY", channel2, null, null)).toBe(true);

    // invalid
    const props3 = {};
    expect(channelPropertiesAreValid("PAY", channel, props3, null)).toBe(false);
  });
});
