import { BffResponse } from "./backend-types/common";
import {
  BffPaymentRequest,
  BffPaymentToken,
} from "./backend-types/payment-entity";

const examplePublicKey =
  "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEyCADI5pdf6KmN8+Fxl2ES3yolUKXunNeY3gGScGNEvDcrcHAPKxIInAo5DVnDvTtYtqZvx/bu7HLeBJNMXwHhie/uyNEtT8dSaLc9bd0WSlYdxI+iUsTv2Qu0LiiPrZs";
const exampleSignature =
  "NKf7whM9meUs/eRCvG0oc180MDiyeli3kH6EQ3ZahECHsZQi5G2IpH6vk3cYMtf01Y1L4OBn1SZCOv1kwpjIUet4DJeoTwwq2nM5b+K7rD+/WFTi3AEX4NWJNkKi0a91";

export function makeTestSdkKey() {
  return `session-12345678901234567890-${examplePublicKey}-${exampleSignature}`;
}

export function makeTestBffData(): BffResponse {
  return {
    session: {
      payment_session_id: "ps-68f870c1d394132ab724261e",
      created: "2025-10-22T05:50:57.478Z",
      updated: "2025-10-22T05:50:57.478Z",
      status: "ACTIVE",
      reference_id: "simontestwhyitbrokeagain",
      currency: "IDR",
      amount: 1000,
      country: "ID",
      expires_at: "2025-10-22T06:20:57.188Z",
      session_type: "PAY",
      mode: "PAYMENT_LINK",
      locale: "en",
      business_id: "5f4708b7bd394b0400b96276",
      customer_id: "cust-78f95e42-4e9d-4556-827b-0e0b8ead68fc",
      capture_method: "AUTOMATIC",
      items: [
        {
          reference_id: "1234",
          type: "DIGITAL_PRODUCT",
          name: "Item 1",
          net_unit_amount: 1000,
          quantity: 1,
          category: "",
        },
      ],
      success_return_url: "https://example.com/success/example_item=my_item",
      cancel_return_url: "https://example.com/cancel/example_item=my_item",
      payment_link_url: "https://xen.to/9ff9l4Jo",
    },
    business: {
      name: "Boxify",
      country_of_operation: "Indonesia",
      merchant_profile_picture_url:
        "https://xnd-merchant-logos.s3.amazonaws.com/business/production/5f4708b7bd394b0400b96276-1759340968286.png",
    },
    customer: {
      type: "INDIVIDUAL",
      id: "cust-78f95e42-4e9d-4556-827b-0e0b8ead68fc",
      email: "sim**@xendit.co",
      mobile_number: null,
      phone_number: null,
      individual_detail: {
        given_names: "sim********",
        surname: null,
      },
      business_detail: null,
    },
    channels: [
      {
        brand_name: "Mandiri Virtual Account",
        channel_code: "MANDIRI_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/MANDIRI_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#003D79",
        min_amount: 1,
        max_amount: 50000000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "BRI Virtual Account",
        channel_code: "BRI_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BRI_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#00529C",
        min_amount: 1,
        max_amount: 20000000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "BNI Virtual Account",
        channel_code: "BNI_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BNI_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#F15A23",
        min_amount: 1,
        max_amount: 50000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "BNC Virtual Account",
        channel_code: "BNC_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BNC_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#FED001",
        min_amount: 1,
        max_amount: 50000000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "BSI Virtual Account",
        channel_code: "BSI_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BSI_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#168F8C",
        min_amount: 1,
        max_amount: 50000000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "BSS Virtual Account",
        channel_code: "BSS_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BSS_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#A3822E",
        min_amount: 1,
        max_amount: 50000000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "CIMB Virtual Account",
        channel_code: "CIMB_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/CIMB_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#790008",
        min_amount: 1,
        max_amount: 50000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
      {
        brand_name: "Permata Virtual Account",
        channel_code: "PERMATA_VIRTUAL_ACCOUNT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/PERMATA_VIRTUAL_ACCOUNT.svg",
        ui_group: "bank_transfer",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#0064FF",
        min_amount: 1,
        max_amount: 9999999999,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
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
                  regex: "/^[ -~]+$/",
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
            span: 2,
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
            span: 2,
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
        instructions: [],
      },
      {
        brand_name: "DANA",
        channel_code: "DANA",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/DANA.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#018DEF",
        min_amount: 100,
        max_amount: 20000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Get your DANA app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "OVO",
        channel_code: "OVO",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/OVO.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#4D3695",
        min_amount: 100,
        max_amount: 20000000,
        requires_customer_details: false,
        form: [
          {
            label: "Mobile number registered with OVO",
            placeholder: "8000032341",
            type: {
              name: "phone_number",
            },
            channel_property: "account_mobile_number",
            required: true,
            span: 2,
          },
        ],
        instructions: [
          "Get your OVO app ready!",
          "Check your app notification to complete your payment",
        ],
      },
      {
        brand_name: "GoPay",
        channel_code: "GOPAY",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/GOPAY.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#00AED6",
        min_amount: 1,
        max_amount: 50000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Get your GoPay app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "ShopeePay",
        channel_code: "SHOPEEPAY",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/SHOPEEPAY.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#F34336",
        min_amount: 1,
        max_amount: 20000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Get your ShopeePay app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "AstraPay",
        channel_code: "ASTRAPAY",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/ASTRAPAY.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#0E4EE0",
        min_amount: 100,
        max_amount: 20000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Get your AstraPay app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "Jenius Pay",
        channel_code: "JENIUSPAY",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/JENIUSPAY.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#21A6DE",
        min_amount: 1000,
        max_amount: 10000000,
        requires_customer_details: false,
        form: [
          {
            label: "JeniusPay Cashtag",
            placeholder: "$mycashtag",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [
                {
                  regex: "^\\$[a-zA-Z0-9]+$",
                  message:
                    "Please enter a valid cashtag format (e.g., $mycashtag)",
                },
              ],
            },
            channel_property: "cashtag",
            required: true,
            span: 2,
          },
        ],
        instructions: [
          "Get your Jenius Pay app ready!",
          "Check your app notification to complete your payment",
        ],
      },
      {
        brand_name: "LinkAja",
        channel_code: "LINKAJA",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/LINKAJA.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#EA232A",
        min_amount: 100,
        max_amount: 10000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Get your LinkAja app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "NexCash",
        channel_code: "NEXCASH",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/NEXCASH.svg",
        ui_group: "ewallet",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#327AF9",
        min_amount: 1,
        max_amount: 20000000,
        requires_customer_details: false,
        form: [],
        instructions: [
          "Get your NexCash app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "Mandiri Direct Debit",
        channel_code: "MANDIRI_DIRECT_DEBIT",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/MANDIRI_DIRECT_DEBIT.svg",
        ui_group: "online_banking",
        allow_pay_without_save: true,
        allow_save: true,
        brand_color: "#003D79",
        min_amount: 1000,
        max_amount: 1000000,
        requires_customer_details: true,
        form: [],
        instructions: [
          "Get your Mandiri Direct Debit app ready!",
          "Follow the instructions on the next page to complete your payment",
        ],
      },
      {
        brand_name: "Alfamart",
        channel_code: "ALFAMART",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/ALFAMART.svg",
        ui_group: "over_the_counter",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#ED1C24",
        min_amount: 10000,
        max_amount: 5000000,
        requires_customer_details: false,
        form: [
          {
            group_label: "Payer Name",
            label: "Payer Name",
            placeholder: "Payer Name",
            type: {
              name: "text",
              min_length: 1,
              max_length: 250,
              regex_validators: [
                {
                  regex: "^[a-zA-Z0-9 #/\\.\"\\-,'_@()&\\]\\[`:]+$",
                  message: "Only letters and numbers are allowed",
                },
              ],
            },
            channel_property: "payer_name",
            required: true,
            span: 2,
          },
        ],
        instructions: [],
      },
      {
        brand_name: "Indomaret",
        channel_code: "INDOMARET",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/INDOMARET.svg",
        ui_group: "over_the_counter",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#006AB4",
        min_amount: 10000,
        max_amount: 2500000,
        requires_customer_details: false,
        form: [
          {
            group_label: "Payer Name",
            label: "Payer Name",
            placeholder: "Payer Name",
            type: {
              name: "text",
              min_length: 1,
              max_length: 250,
              regex_validators: [
                {
                  regex: "^[a-zA-Z0-9 #/\\.\"\\-,'_@()&\\]\\[`:]+$",
                  message: "Only letters and numbers are allowed",
                },
              ],
            },
            channel_property: "payer_name",
            required: true,
            span: 2,
          },
        ],
        instructions: [],
      },
      {
        brand_name: "QRIS",
        channel_code: "QRIS",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/QRIS.svg",
        ui_group: "qr_code",
        allow_pay_without_save: true,
        allow_save: false,
        brand_color: "#000000",
        min_amount: 1,
        max_amount: 10000000,
        requires_customer_details: false,
        form: [],
        instructions: [],
      },
    ],
    channel_ui_groups: [
      {
        id: "bank_transfer",
        label: "Bank Transfer",
        icon_url:
          "https://assets.xendit.co/payment-session/logos/BANK_TRANSFER.svg",
      },
      {
        id: "cards",
        label: "Cards",
        icon_url: "https://assets.xendit.co/payment-session/logos/CARDS.svg",
      },
      {
        id: "ewallet",
        label: "E-Wallet",
        icon_url: "https://assets.xendit.co/payment-session/logos/EWALLET.svg",
      },
      {
        id: "online_banking",
        label: "Online Banking",
        icon_url:
          "https://assets.xendit.co/payment-session/logos/ONLINE_BANKING.svg",
      },
      {
        id: "over_the_counter",
        label: "Over The Counter",
        icon_url:
          "https://assets.xendit.co/payment-session/logos/OVER_THE_COUNTER.svg",
      },
      {
        id: "qr_code",
        label: "QR Code",
        icon_url: "https://assets.xendit.co/payment-session/logos/QR_CODE.svg",
      },
    ],
  };
}

function makeTestRandomId() {
  // 32 hex characters
  return Array.from({ length: 32 })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");
}

export function makeTestPaymentRequest(channelCode: string): BffPaymentRequest {
  return {
    payment_request_id: `pr-${makeTestRandomId()}`,
    status: "REQUIRES_ACTION",
    channel_code: channelCode,
    actions: [
      {
        type: "REDIRECT_CUSTOMER",
        descriptor: "WEB_URL",
        value: "https://example.com/redirect",
      },
    ],
    session_token_request_id: makeTestRandomId(),
  };
}

export function makeTestPaymentToken(channelCode: string): BffPaymentToken {
  return {
    payment_token_id: `pr-${makeTestRandomId()}`,
    status: "REQUIRES_ACTION",
    channel_code: channelCode,
    actions: [
      {
        type: "REDIRECT_CUSTOMER",
        descriptor: "WEB_URL",
        value: "https://example.com/redirect",
      },
    ],
    session_token_request_id: makeTestRandomId(),
  };
}
