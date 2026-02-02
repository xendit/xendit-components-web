import { MockActionType } from "./backend-types/channel";
import { BffPollResponse, BffResponse } from "./backend-types/common";
import {
  BffAction,
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequest,
  BffPaymentRequestStatus,
  BffPaymentToken,
  BffPaymentTokenStatus,
} from "./backend-types/payment-entity";
import { BffSession } from "./backend-types/session";
import { assert } from "./utils";

const examplePublicKey =
  "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEyCADI5pdf6KmN8+Fxl2ES3yolUKXunNeY3gGScGNEvDcrcHAPKxIInAo5DVnDvTtYtqZvx/bu7HLeBJNMXwHhie/uyNEtT8dSaLc9bd0WSlYdxI+iUsTv2Qu0LiiPrZs";
const exampleSignature =
  "NKf7whM9meUs/eRCvG0oc180MDiyeli3kH6EQ3ZahECHsZQi5G2IpH6vk3cYMtf01Y1L4OBn1SZCOv1kwpjIUet4DJeoTwwq2nM5b+K7rD+/WFTi3AEX4NWJNkKi0a91";

export function makeTestSdkKey() {
  return `session-${randomHexString(32)}-mock-${examplePublicKey}-${exampleSignature}`;
}

const ONE_MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

export function makeTestBffData(): BffResponse {
  const mockNow = new Date().toISOString();
  const mockExpiry = new Date(Date.now() + ONE_MONTH_IN_MS).toISOString();
  return {
    session: {
      payment_session_id: `ps-${randomHexString(24)}`,
      created: mockNow,
      updated: mockNow,
      status: "ACTIVE",
      reference_id: randomUUID(),
      description: "Test session",
      currency: "IDR",
      amount: 10000,
      country: "ID",
      expires_at: mockExpiry,
      session_type: "PAY",
      mode: "COMPONENTS",
      locale: "en",
      business_id: randomHexString(24),
      customer_id: `cust-${randomUUID()}`,
      capture_method: "AUTOMATIC",
      allow_save_payment_method: "OPTIONAL",
      items: [
        {
          reference_id: randomUUID(),
          type: "DIGITAL_PRODUCT",
          name: "Item 1",
          net_unit_amount: 50000,
          quantity: 1,
          category: "",
        },
        {
          reference_id: randomUUID(),
          type: "DIGITAL_SERVICE",
          name: "Item 2",
          net_unit_amount: 50000,
          quantity: 1,
          category: "",
        },
      ],
    },
    business: {
      name: "Components Mock Merchant",
      country_of_operation: "Indonesia",
      merchant_profile_picture_url:
        "https://placehold.co/256x256.png?text=Logo",
    },
    customer: {
      type: "INDIVIDUAL",
      id: `cust-${randomUUID()}`,
      email: "exa**@example.com",
      mobile_number: null,
      phone_number: null,
      individual_detail: {
        given_names: "exa********",
        surname: null,
      },
      business_detail: null,
    },
    channels: [
      {
        brand_name: "Cards",
        channel_code: "CARDS",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/CARDS.svg",
        ui_group: "cards",
        allow_pay_without_save: true,
        allow_save: true,
        brand_color: "#000000",
        min_amount: 5000,
        max_amount: 200000000,
        requires_customer_details: false,
        _mock_action_type: "IFRAME",
        card: {
          brands: [
            {
              name: "VISA",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/VISA.svg",
            },
            {
              name: "MASTERCARD",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
            },
            {
              name: "JCB",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/JCB.svg",
            },
          ],
        },
        form: [
          {
            group_label: "Card Details",
            label: "Card Number",
            placeholder: "1234 1234 1234 1234",
            type: {
              name: "credit_card_number",
            },
            channel_property: "card_details.card_number",
            required: true,
            span: 2,
          },
          {
            label: "Card Expiry Date",
            placeholder: "MM/YY",
            type: {
              name: "credit_card_expiry",
            },
            channel_property: [
              "card_details.expiry_month",
              "card_details.expiry_year",
            ],
            required: true,
            span: 1,
            join: true,
          },
          {
            label: "CVN",
            placeholder: "CVV",
            type: {
              name: "credit_card_cvn",
            },
            channel_property: "card_details.cvn",
            required: true,
            span: 1,
            join: true,
          },
          {
            group_label: "Cardholder Name",
            label: "First Name",
            placeholder: "First Name",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [
                {
                  regex: "/^[a-zA-Z\\u00C0-\\u017F\\s]+$/",
                  message:
                    "Invalid input. Please use alphabetic characters only",
                },
              ],
            },
            channel_property: "card_details.cardholder_first_name",
            required: true,
            span: 1,
          },
          {
            label: "Last Name",
            placeholder: "Last Name",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [
                {
                  regex: "/^[ -~]+$/",
                  message:
                    "Invalid input. Please use alphabetic characters only",
                },
              ],
            },
            channel_property: "card_details.cardholder_last_name",
            required: true,
            span: 1,
          },
          {
            label: "Email",
            placeholder: "john.doe@example.com",
            type: {
              name: "email",
            },
            channel_property: "card_details.cardholder_email",
            required: true,
            span: 2,
          },
          {
            label: "Mobile Number",
            placeholder: "8000032341",
            type: {
              name: "phone_number",
            },
            channel_property: "card_details.cardholder_phone_number",
            required: true,
            span: 2,
          },
          {
            group_label: "Billing Address",
            label: "First Name",
            placeholder: "First Name",
            type: {
              name: "text",
              max_length: 255,
            },
            channel_property: "billing_information.first_name",
            span: 1,
            required: true,
            flags: {
              require_billing_information: true,
            },
          },
          {
            label: "Last Name",
            placeholder: "Last Name",
            type: {
              name: "text",
              max_length: 255,
            },
            channel_property: "billing_information.last_name",
            span: 1,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "Email",
            placeholder: "Email",
            type: {
              name: "text",
              max_length: 255,
            },
            channel_property: "billing_information.email",
            span: 2,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "Country",
            placeholder: "Country",
            type: {
              name: "country",
            },
            channel_property: "billing_information.country",
            span: 1,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "Province",
            placeholder: "State / Province",
            type: {
              name: "province",
            },
            channel_property: "billing_information.province_state",
            span: 1,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "City",
            placeholder: "City",
            type: {
              name: "text",
              max_length: 255,
            },
            channel_property: "billing_information.city",
            span: 2,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "Address Line 1",
            placeholder: "Address Line 1",
            type: {
              name: "text",
              max_length: 255,
            },
            channel_property: "billing_information.street_line1",
            span: 2,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "Address Line 2",
            placeholder: "Address Line 2",
            type: {
              name: "text",
              max_length: 255,
            },
            channel_property: "billing_information.street_line2",
            span: 2,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
          {
            label: "Postal Code",
            placeholder: "Postal Code",
            type: {
              name: "postal_code",
            },
            channel_property: "billing_information.postal_code",
            span: 2,
            required: true,
            flags: {
              require_billing_information: true,
            },
            join: true,
          },
        ],
        instructions: [
          "Mock Cards channel",
          "This mock channel behaves similarly to the production CARDS channel.",
        ],
      },
      {
        brand_name: "Mock E-Wallet Channel",
        channel_code: "MOCK_EWALLET",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "other",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        _mock_action_type: "REDIRECT",
        form: [],
        instructions: [
          "Mock E-Wallet channel",
          "This mock channel behaves similarly to production E-Wallets channels with no user input.",
        ],
      },
      {
        brand_name: "Mock E-Wallet Channel (Iframe action)",
        channel_code: "MOCK_EWALLET_IFRAME",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "other",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        _mock_action_type: "IFRAME",
        form: [],
        instructions: [
          "Mock E-Wallet channel",
          "This mock channel has as iframe action.",
        ],
      },
      {
        brand_name: "Mock E-Wallet Channel (Phone input)",
        channel_code: "MOCK_EWALLET_WITH_PHONE",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "other",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        _mock_action_type: "REDIRECT",
        form: [
          {
            label: "Phone Number",
            placeholder: "123 123 132",
            type: {
              name: "phone_number",
            },
            channel_property: "phone_number_field",
            required: true,
            span: 2,
          },
        ],
        instructions: [
          "Mock E-Wallet channel",
          "This mock channel behaves similarly to production E-Wallets channels with a phone number input.",
        ],
      },
      {
        brand_name: "Mock QR Channel",
        channel_code: "MOCK_QR",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "other",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        _mock_action_type: "QR",
        form: [],
        instructions: [
          "Mock QR channel",
          "This mock channel behaves similarly to production QR channels.",
        ],
        pm_type: "QR_CODE",
      },
      {
        brand_name: "Mock Direct Debit Channel",
        channel_code: "MOCK_DIRECT_DEBIT",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "other",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Mock Direct Debit channel",
          "This mock channel behaves similarly to production Direct Debit channels.",
        ],
      },
      {
        brand_name: "Mock OTC Channel",
        channel_code: "MOCK_OTC",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "other",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        _mock_action_type: "BARCODE",
        form: [
          {
            label: "Payer Name",
            placeholder: "Payer Name",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "payer_name",
            required: true,
            span: 2,
          },
        ],
        instructions: [
          "Mock OTC channel",
          "This mock channel behaves similarly to production OTC channels.",
        ],
      },
      {
        brand_name: "Input Test",
        channel_code: "UI_INPUT_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            label: "Card Number (Iframe)",
            placeholder: "1234 1234 1234 1234",
            type: {
              name: "credit_card_number",
            },
            channel_property: "card_number",
            required: false,
            span: 2,
          },
          {
            label: "Card Expiry Date (Iframe)",
            placeholder: "MM/YY",
            type: {
              name: "credit_card_expiry",
            },
            channel_property: ["expiry_month", "expiry_year"],
            required: false,
            span: 2,
          },
          {
            label: "CVN (Iframe)",
            placeholder: "CVV",
            type: {
              name: "credit_card_cvn",
            },
            channel_property: "cvn",
            required: false,
            span: 2,
          },
          {
            label: "Text",
            placeholder: "Text",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "text_field",
            required: false,
            span: 2,
          },
          {
            label: "Phone Number",
            placeholder: "123 123 123",
            type: {
              name: "phone_number",
            },
            channel_property: "phone_number_field",
            required: false,
            span: 2,
          },
          {
            label: "Email",
            placeholder: "test@example.com",
            type: {
              name: "email",
            },
            channel_property: "email_field",
            required: false,
            span: 2,
          },
          {
            label: "Postal Code",
            placeholder: "123456",
            type: {
              name: "postal_code",
            },
            channel_property: "postal_code_field",
            required: false,
            span: 2,
          },
          {
            label: "Country",
            placeholder: "Select",
            type: {
              name: "country",
            },
            channel_property: "country_field",
            required: false,
            span: 2,
          },
          {
            label: "Dropdown",
            placeholder: "Select",
            type: {
              name: "dropdown",
              options: [
                { label: "Option 1", value: "option_1" },
                { label: "Option 2", value: "option_2" },
                { label: "Option 3", value: "option_3" },
              ],
            },
            channel_property: "dropdown_field",
            required: false,
            span: 2,
          },
          {
            label: "Dropdown With Icons",
            placeholder: "Select",
            type: {
              name: "dropdown",
              options: [
                {
                  label: "Option 1",
                  value: "option_1",
                  icon_url: "https://placehold.co/16",
                },
                {
                  label: "Option 2",
                  value: "option_2",
                  icon_url: "https://placehold.co/16",
                },
                {
                  label: "Option 3",
                  value: "option_3",
                  icon_url: "https://placehold.co/16",
                },
              ],
            },
            channel_property: "dropdown_field_with_icons",
            required: false,
            span: 2,
          },
        ],
        instructions: [
          "This test demonstrates basic usage of all input types.",
          "All fields here are optional and blank values should pass validation.",
        ],
      },
      {
        brand_name: "Field Grouping Test",
        channel_code: "UI_FIELD_GROUPING_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            group_label: "Vertical Grouping",
            label: "Top",
            placeholder: "Top",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "a1",
            required: false,
            span: 2,
          },
          {
            label: "Middle",
            placeholder: "Middle",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "a2",
            required: false,
            span: 2,
            join: true,
          },
          {
            label: "Bottom",
            placeholder: "Bottom",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "a3",
            required: false,
            span: 2,
            join: true,
          },
          {
            group_label: "Horizontal Grouping",
            label: "Text",
            placeholder: "Left",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "b1",
            required: false,
            span: 1,
          },
          {
            label: "Text",
            placeholder: "Right",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "b1",
            required: false,
            span: 1,
            join: true,
          },
          {
            group_label: "Mixed Grouping",
            label: "Text",
            placeholder: "Top Left",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "c1",
            required: false,
            span: 1,
          },
          {
            label: "Text",
            placeholder: "Top Right",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "c2",
            required: false,
            span: 1,
            join: true,
          },
          {
            label: "Text",
            placeholder: "Middle Left",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "c3",
            required: false,
            span: 1,
            join: true,
          },
          {
            label: "Text",
            placeholder: "Middle Right",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "c4",
            required: false,
            span: 1,
            join: true,
          },
          {
            label: "Text",
            placeholder: "Bottom Left",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "c5",
            required: false,
            span: 1,
            join: true,
          },
          {
            label: "Text",
            placeholder: "Bottom Right",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "c6",
            required: false,
            span: 1,
            join: true,
          },
        ],
        instructions: [
          "This test demonstrates field grouping.",
          "Fields can be 1 or 2 cells wide and can be grouped in any arrangement.",
        ],
      },
      {
        brand_name: "Text Validation Test",
        channel_code: "UI_TEXT_VALIDATION_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            label: "Required Text Field",
            placeholder: "Required",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "required",
            required: true,
            span: 2,
          },
          {
            label: "Validate Minimum Length (5)",
            placeholder: "Min 5 characters",
            type: {
              name: "text",
              min_length: 5,
              max_length: 50,
            },
            channel_property: "min_5_chars",
            required: false,
            span: 2,
          },
          {
            label: "Validate Using Regexp (/^[a-zA-Z0-9]+$/)",
            placeholder: "Alphanumeric only",
            type: {
              name: "text",
              max_length: 50,
              regex_validators: [
                {
                  regex: "/^[a-zA-Z0-9]+$/",
                  message:
                    "Invalid input. Please use alphanumeric characters only",
                },
              ],
            },
            channel_property: "regexp_validation",
            required: false,
            span: 2,
          },
        ],
        instructions: [
          "This test demonstrates text field validation.",
          "Fields should validate on blur or `submit()` or `revealValidationErrors()`. Blurring a blank field does not trigger validation.",
        ],
      },
      {
        brand_name: "State/Province Field Test",
        channel_code: "UI_STATE_PROVINCE_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            group_label: "Country + State/Province Fields",
            label: "Country",
            placeholder: "Country",
            type: {
              name: "country",
            },
            channel_property: "country_field",
            required: true,
            span: 2,
          },
          {
            label: "State / Province",
            placeholder: "State / Province",
            type: {
              name: "province",
            },
            channel_property: "province_field",
            required: true,
            span: 2,
            join: true,
          },
          {
            group_label:
              "Country + State/Province Fields (Horizontal Grouping)",
            label: "Country",
            placeholder: "Country",
            type: {
              name: "country",
            },
            channel_property: "country_field_2",
            required: true,
            span: 1,
          },
          {
            label: "State / Province",
            placeholder: "State / Province",
            type: {
              name: "province",
            },
            channel_property: "province_field_2",
            required: true,
            span: 1,
            join: true,
          },
        ],
        instructions: [
          "This test demonstrates the country + state/province field combination.",
          "Selecting certain countries (US, CA, GB) should change the state/province field to a dropdown with predefined options.",
        ],
      },
      {
        brand_name: "Conditional Field Test",
        channel_code: "UI_CONDITIONAL_FIELD_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            label: "Toggle Hidden Field",
            placeholder: "Select",
            type: {
              name: "dropdown",
              options: [
                { label: "Show", value: "show" },
                { label: "Hide", value: "hide" },
              ],
            },
            channel_property: "toggle",
            required: true,
            span: 2,
          },
          {
            label: "Conditional Field",
            placeholder: "This field is conditionally shown",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "conditional_field",
            required: true,
            span: 2,
            join: true,
            display_if: [["toggle", "equals", "show"]],
          },
        ],
        instructions: [
          "This test demonstrates conditional field display based on another field's value.",
          "The second field should only appear if 'Show' is selected in the first field.",
        ],
      },
      {
        brand_name: "Save Payment Details Test",
        channel_code: "UI_SAVE_PAYMENT_DETAILS_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: true,
        allow_save: true,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "This channel supports both one-time payment and pay-and-save.",
          "A checkbox should be displayed.",
        ],
      },
      {
        brand_name: "Paired Channels Test",
        channel_code: "UI_PAIRED_CHANNELS_TEST_1",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            label: "This should show if the save checkbox is unchecked",
            placeholder: "Unchecked",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "nonsave",
            required: false,
            span: 2,
          },
        ],
        instructions: [
          "This channel does not support save, but has a paired channel that does.",
          "Changing the save checkbox switches between the two channels.",
        ],
      },
      {
        brand_name: "Paired Channels Test",
        channel_code: "UI_PAIRED_CHANNELS_TEST_2",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: false,
        allow_save: true,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [
          {
            label: "This should show if the save checkbox is checked",
            placeholder: "Checked",
            type: {
              name: "text",
              max_length: 50,
            },
            channel_property: "save",
            required: false,
            span: 2,
          },
        ],
        instructions: [
          "This channel can only be used for pay-and-save, but has a paired channel that supports one time payment.",
          "Changing the save checkbox switches between the two channels.",
        ],
      },
      {
        brand_name: "Banner Test",
        channel_code: "UI_BANNER_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "ui_tests",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        banner: {
          image_url: "https://placehold.co/256x32.png?text=Banner",
          alt_text: "",
        },
        form: [],
        instructions: [
          "This channel has a banner image.",
          "It should be displayed above this text.",
        ],
      },
      {
        brand_name: "Single Item Test",
        channel_code: "GROUP_SINGLE_ITEM_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "single_item",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "This channel is in a group by itself.",
          "The channel picker should automatically select it when the group is opened.",
        ],
      },
      {
        brand_name: "Disabled Group Test",
        channel_code: "GROUP_DISABLED_GROUP_TEST",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "disabled",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 999999999,
        max_amount: 9999999999,
        requires_customer_details: false,
        form: [],
        instructions: [
          "This channel is in a disabled group.",
          "Since all channels in this group are disabled, the group should not be selectable. You should never see this text because creating this channel will throw an error.",
        ],
      },
      {
        brand_name: "Partial Disabled Group (Enabled)",
        channel_code: "GROUP_PARTIAL_DISABLED_1",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "partial_disabled",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1000,
        max_amount: 100000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "This channel is in a partially disabled group.",
          "This channel is enabled, but the other channel in the group is disabled. This channel should be automatically selected by the channel picker because it's the only enabled option.",
        ],
      },
      {
        brand_name: "Partial Disabled Group (Disabled)",
        channel_code: "GROUP_PARTIAL_DISABLED_2",
        brand_logo_url: "https://placehold.co/48x48.png?text=Logo",
        ui_group: "partial_disabled",
        allow_pay_without_save: false,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 999999999,
        max_amount: 9999999999,
        requires_customer_details: false,
        form: [],
        instructions: [
          "This channel is in a partially disabled group.",
          "This channel is disabled. You should never see this text because creating this channel will throw an error.",
        ],
      },
    ],
    channel_ui_groups: [
      {
        id: "cards",
        label: "Mock Cards",
        icon_url: "https://assets.xendit.co/payment-session/logos/CARDS.svg",
      },
      {
        id: "other",
        label: "Other Mock Channels",
        icon_url: "https://placehold.co/48x48.png?text=Logo",
      },
      {
        id: "ui_tests",
        label: "Channel UI Test Cases",
        icon_url: "https://placehold.co/48x48.png?text=Logo",
      },
      {
        id: "single_item",
        label: "Mock Single Item Group",
        icon_url: "https://placehold.co/48x48.png?text=Logo",
      },
      {
        id: "disabled",
        label: "Mock Disabled Group",
        icon_url: "https://placehold.co/48x48.png?text=Logo",
      },
      {
        id: "partial_disabled",
        label: "Mock Partial Disabled Group",
        icon_url: "https://placehold.co/48x48.png?text=Logo",
      },
    ],
  };
}

function randomBytes(length: number) {
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
}

function randomUUID() {
  return [
    randomHexString(8),
    randomHexString(4),
    randomHexString(4),
    randomHexString(4),
    randomHexString(12),
  ].join("-");
}

function randomHexString(length: number) {
  assert(length % 2 === 0);
  const bytes = randomBytes(length / 2);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function makeTestPollResponseForSuccess(
  session: BffSession,
  paymentEntity: BffPaymentEntity,
): BffPollResponse {
  const paymentRequest =
    paymentEntity.type === BffPaymentEntityType.PaymentRequest
      ? paymentEntity.entity
      : undefined;
  const paymentToken =
    paymentEntity.type === BffPaymentEntityType.PaymentToken
      ? paymentEntity.entity
      : undefined;

  return {
    session: {
      ...session,
      status: "COMPLETED",
      payment_request_id: paymentRequest?.payment_request_id,
      payment_token_id: paymentToken?.payment_token_id,
    },
    payment_request: withPaymentEntityStatus(paymentRequest, "SUCCEEDED"),
    payment_token: withPaymentEntityStatus(paymentToken, "ACTIVE"),
    succeeded_channel: {
      channel_code: paymentEntity.entity.channel_code,
      logo_url: "https://placehold.co/48",
    },
  };
}

export function makeTestPollResponseForFailure(
  session: BffSession,
  paymentEntity: BffPaymentEntity,
): BffPollResponse {
  const paymentRequest =
    paymentEntity.type === BffPaymentEntityType.PaymentRequest
      ? paymentEntity.entity
      : undefined;
  const paymentToken =
    paymentEntity.type === BffPaymentEntityType.PaymentToken
      ? paymentEntity.entity
      : undefined;

  return {
    session: {
      ...session,
      status: "ACTIVE",
    },
    payment_request: withPaymentEntityStatus(paymentRequest, "FAILED"),
    payment_token: withPaymentEntityStatus(paymentToken, "FAILED"),
  };
}

export function withPaymentEntityStatus<
  T extends BffPaymentRequest | BffPaymentToken | undefined,
>(
  prOrPt: T,
  status: T extends BffPaymentRequest
    ? BffPaymentRequestStatus
    : T extends BffPaymentToken
      ? BffPaymentTokenStatus
      : undefined,
): T {
  if (!prOrPt) return prOrPt;
  return {
    ...prOrPt,
    status: status,
  };
}

export function makeTestPaymentRequest(
  channelCode: string,
  mockActionType: MockActionType | undefined,
): BffPaymentRequest {
  if (mockActionType) {
    return {
      payment_request_id: `pr-${randomUUID()}`,
      status: "REQUIRES_ACTION",
      channel_code: channelCode,
      actions: makeMockActions(mockActionType),
      session_token_request_id: randomUUID(),
    };
  } else {
    return {
      payment_request_id: `pr-${randomUUID()}`,
      status: "SUCCEEDED",
      channel_code: channelCode,
      actions: [],
      session_token_request_id: randomUUID(),
    };
  }
}

export function makeTestPaymentToken(
  channelCode: string,
  mockActionType: MockActionType | undefined,
): BffPaymentToken {
  if (mockActionType) {
    return {
      payment_token_id: `pt-${randomUUID()}`,
      status: "REQUIRES_ACTION",
      channel_code: channelCode,
      actions: makeMockActions(mockActionType),
      session_token_request_id: randomUUID(),
    };
  } else {
    return {
      payment_token_id: `pt-${randomUUID()}`,
      status: "ACTIVE",
      channel_code: channelCode,
      actions: [],
      session_token_request_id: randomUUID(),
    };
  }
}

export function makeMockActions(
  mockActionType: MockActionType | undefined,
): BffAction[] {
  return mockActionType ? [makeOneMockAction(mockActionType)] : [];
}

export function makeOneMockAction(mockActionType: MockActionType): BffAction {
  switch (mockActionType) {
    case "IFRAME":
      return {
        type: "REDIRECT_CUSTOMER",
        descriptor: "WEB_URL",
        value: "https://example.com/iframe",
        iframe_capable: true,
      };
    case "REDIRECT":
      return {
        type: "REDIRECT_CUSTOMER",
        descriptor: "WEB_URL",
        value: "https://example.com/redirect",
        iframe_capable: false,
      };
    case "QR":
      return {
        type: "PRESENT_TO_CUSTOMER",
        descriptor: "QR_STRING",
        value: "https://example.com/qr-code-data",
        action_title: "Pay with QR Code",
        action_subtitle: "Scan the QR code below",
        action_graphic: "",
        instructions: null,
      };
    case "BARCODE":
      return {
        type: "PRESENT_TO_CUSTOMER",
        descriptor: "PAYMENT_CODE",
        value: "1234567890",
        action_title: "Pay at a Store",
        action_subtitle: "Show this barcode to the cashier",
        action_graphic: "",
        instructions: null,
      };
    case "VA":
      return {
        type: "PRESENT_TO_CUSTOMER",
        descriptor: "VIRTUAL_ACCOUNT_NUMBER",
        value: "1234567890",
        action_title: "Pay with Virtual Account",
        action_subtitle:
          "Protect yourself from fraud - ensure all details are correct",
        action_graphic: "",
        instructions: null,
      };
  }
  throw new Error(`Unknown mock action type: ${mockActionType}`);
}
