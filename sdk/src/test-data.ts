import { BffResponse } from "./bff-types";

const examplePublicKey =
  "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEVpIgrkofEwt4eLojVyGHgqTu3DS/kKmzvNf+fS2AdkiSQYrNYdtRjY3Ga+Vif+MR6GE5g3A5r5DXP6RFTel7CoIdZ7tyylAq8pwzYbEyb7Q0KOWcifkH/ZyQVA7Gz11e";
const exampleSignature =
  "1WJcUIskN1a7MXUF6ddsjSlpQ7PXk5X47bIExisXmzxXqKColRYXVwjVVguyYiHwUyeuB908L+tEf7xbxbzDcs+0/EJGL2loKV/fyv6iWDM72+Sv5SvfOBImhfT38yB7";

export function makeTestBffData(): BffResponse {
  return {
    session: {
      payment_session_id: "ps-688adc58e506c45fd2b7f049",
      client_key: `pss-1234567890-${examplePublicKey}-${exampleSignature}`,
      created: "2025-07-31T03:00:41.122Z",
      updated: "2025-07-31T03:00:41.122Z",
      status: "ACTIVE",
      reference_id: "Alice",
      currency: "IDR",
      amount: 1000,
      country: "ID",
      expires_at: "2025-07-31T03:30:39.947Z",
      session_type: "PAY",
      mode: "PAYMENT_LINK",
      locale: "en",
      business_id: "627cb541cbf9b47301cd0100",
      customer_id: "cust-324ee78a-d624-4868-84fc-92278a5eb86a",
      capture_method: "AUTOMATIC",
      description: "Insurance Plan Registration",
      success_return_url:
        "https://yourcompany.com/success/example_item=my_item",
      cancel_return_url: "https://yourcompany.com/cancel/example_item=my_item",
      payment_link_url: "https://url-shortener-ui-dev.stg.tidnex.dev/GSrBS0cX"
    },
    business: {
      name: "C.C.D.",
      country_of_operation: "Indonesia"
    },
    customer: {
      type: "INDIVIDUAL",
      id: "cust-324ee78a-d624-4868-84fc-92278a5eb86a",
      email: "app****@forter.com",
      mobile_number: "+62********8347",
      phone_number: null,
      individual_detail: {
        given_names: "joh*****",
        surname: null
      },
      business_detail: null
    },
    payment_methods: [
      {
        channel_code: "BRI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BRI_VIRTUAL_ACCOUNT.svg",
        form: [
          {
            label: "Virtual Account Number",
            placeholder: "88696969696988",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 50,
              regex_validators: []
            },
            channel_property: "virtual_account_number",
            required: false,
            span: 2
          },
          {
            label: "Payer Name",
            placeholder: "John Doe",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 100,
              regex_validators: []
            },
            channel_property: "payer_name",
            required: false,
            span: 2
          },
          {
            label: "Display Name",
            placeholder: "John D.",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 100,
              regex_validators: []
            },
            channel_property: "display_name",
            required: false,
            span: 2
          },
          {
            label: "Suggested Amount",
            placeholder: "100000",
            type: { name: "generic_numeric", min_length: 1, max_length: 15 },
            channel_property: "suggested_amount",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "HANA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/HANA_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "BJB_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BJB_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "BCA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BCA_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "BNI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BNI_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "BSI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BSI_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "MANDIRI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/MANDIRI_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "CIMB_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/CIMB_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "BNC_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BNC_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "MUAMALAT_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/MUAMALAT_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "SAHABAT_SAMPOERNA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/SAHABAT_SAMPOERNA_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "PERMATA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/PERMATA_VIRTUAL_ACCOUNT.svg"
      },
      {
        channel_code: "CARDS",
        pm_type: "CARDS",
        logo_url: "https://assets.xendit.co/payment-session/logos/CARDS.svg",
        card: {
          brands: [
            {
              name: "VISA",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/VISA.svg"
            },
            {
              name: "VISA_ELECTRON",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/VISA_ELECTRON.svg"
            },
            {
              name: "MASTERCARD",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg"
            },
            {
              name: "AMEX",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/AMEX.svg"
            },
            {
              name: "JCB",
              logo_url: "https://assets.xendit.co/payment-session/logos/JCB.svg"
            },
            {
              name: "GPN",
              logo_url: "https://assets.xendit.co/payment-session/logos/GPN.svg"
            }
          ]
        },
        form: [
          {
            label: "Card Number",
            placeholder: "4111 1111 1111 1111",
            type: { name: "credit_card_number" },
            channel_property: "card_details.card_number",
            required: true,
            span: 2
          },
          {
            label: "Expiry",
            placeholder: "12/28",
            type: { name: "credit_card_expiry" },
            channel_property: [
              "card_details.expiry_month",
              "card_details.expiry_year"
            ],
            required: true,
            span: 1,
            join: true
          },
          {
            label: "CVN",
            placeholder: "123",
            type: { name: "credit_card_cvn" },
            channel_property: "card_details.cvn",
            required: true,
            span: 1,
            join: true
          },
          {
            label: "Cardholder Name",
            placeholder: "John Doe",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 50,
              regex_validators: []
            },
            channel_property: "card_details.cardholder_name",
            required: true,
            span: 2
          },
          {
            label: "Cardholder Email",
            placeholder: "john.doe@example.com",
            type: { name: "email" },
            channel_property: "card_details.cardholder_email",
            required: false,
            span: 2
          },
          {
            label: "Cardholder Phone",
            placeholder: "+1234567890",
            type: { name: "phone_number" },
            channel_property: "card_details.cardholder_phone_number",
            required: false,
            span: 2
          },
          {
            label: "Street Address Line 1",
            placeholder: "123 Main Street",
            type: { name: "street_address", line: 1 },
            channel_property: "billing_information.street_line1",
            required: false,
            span: 2
          },
          {
            label: "Street Address Line 2",
            placeholder: "Apt 4B",
            type: { name: "street_address", line: 2 },
            channel_property: "billing_information.street_line2",
            required: false,
            span: 2
          },
          {
            label: "City",
            placeholder: "New York",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 255
            },
            channel_property: "billing_information.city",
            required: false,
            span: 1
          },
          {
            label: "Province/State",
            placeholder: "NY",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 255,
              regex_validators: []
            },
            channel_property: "billing_information.province_state",
            required: false,
            span: 1
          },
          {
            label: "Postal Code",
            placeholder: "10001",
            type: { name: "postal_code" },
            channel_property: "billing_information.postal_code",
            required: false,
            span: 1
          },
          {
            label: "Country",
            placeholder: "United States",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "United States", value: "US" },
                { label: "Canada", value: "CA" },
                { label: "United Kingdom", value: "GB" },
                { label: "Indonesia", value: "ID" },
                { label: "Singapore", value: "SG" },
                { label: "Malaysia", value: "MY" },
                { label: "Thailand", value: "TH" },
                { label: "Philippines", value: "PH" },
                { label: "Vietnam", value: "VN" }
              ]
            },
            channel_property: "billing_information.country",
            required: false,
            span: 1
          }
        ]
      },
      {
        channel_code: "SHOPEEPAY",
        pm_type: "EWALLET",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/SHOPEEPAY.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          },
          {
            label: "Allowed Payment Options",
            placeholder: "Pay Later Postpaid",
            type: {
              name: "generic_dropdown",
              options: [
                {
                  label: "Pay Later Postpaid",
                  subtitle: "Pay next month",
                  value: "PAYLATER_POSTPAID"
                },
                {
                  label: "Pay Later Installments",
                  subtitle: "Pay with installments",
                  value: "PAYLATER_INSTALLMENTS_4MO"
                }
              ]
            },
            channel_property: "allowed_payment_options",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "OVO",
        pm_type: "EWALLET",
        logo_url: "https://assets.xendit.co/payment-session/logos/OVO.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "LINKAJA_QR_CODE",
        pm_type: "QR_CODE",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/LINKAJA_QR_CODE.svg"
      },
      {
        channel_code: "BRI_DIRECT_DEBIT",
        pm_type: "DIRECT_DEBIT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/BRI_DIRECT_DEBIT.svg",
        form: [
          {
            label: "Account Email",
            placeholder: "payments@example.com",
            type: { name: "email" },
            channel_property: "account_email",
            required: false,
            span: 2
          },
          {
            label: "Account Mobile Number",
            placeholder: "+6281234567890",
            type: { name: "phone_number" },
            channel_property: "account_mobile_number",
            required: false,
            span: 2
          },
          {
            label: "Card Last Four",
            placeholder: "1234",
            type: {
              name: "generic_numeric",
              min_length: 4,
              max_length: 4
            },
            channel_property: "card_last_four",
            required: false,
            span: 1
          },
          {
            label: "Card Expiry",
            placeholder: "06/24",
            type: { name: "credit_card_expiry" },
            channel_property: "card_expiry",
            required: false,
            span: 1
          },
          {
            label: "Account Identity Number",
            placeholder: "12345678901112",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 50,
              regex_validators: []
            },
            channel_property: "account_identity_number",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "XENDIT_QR_CODE",
        pm_type: "QR_CODE",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/XENDIT_QR_CODE.svg"
      },
      {
        channel_code: "DANA_QR_CODE",
        pm_type: "QR_CODE",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/DANA_QR_CODE.svg"
      },
      {
        channel_code: "ASTRAPAY",
        pm_type: "EWALLET",
        logo_url: "https://assets.xendit.co/payment-session/logos/ASTRAPAY.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "LINKAJA",
        pm_type: "EWALLET",
        logo_url: "https://assets.xendit.co/payment-session/logos/LINKAJA.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "MANDIRI_DIRECT_DEBIT",
        pm_type: "DIRECT_DEBIT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/MANDIRI_DIRECT_DEBIT.svg",
        form: [
          {
            label: "Account Email",
            placeholder: "payments@example.com",
            type: { name: "email" },
            channel_property: "account_email",
            required: false,
            span: 2
          },
          {
            label: "Account Mobile Number",
            placeholder: "+6281234567890",
            type: { name: "phone_number" },
            channel_property: "account_mobile_number",
            required: false,
            span: 2
          },
          {
            label: "Card Last Four",
            placeholder: "1234",
            type: {
              name: "generic_numeric",
              min_length: 4,
              max_length: 4
            },
            channel_property: "card_last_four",
            required: false,
            span: 1
          },
          {
            label: "Card Expiry",
            placeholder: "06/24",
            type: { name: "credit_card_expiry" },
            channel_property: "card_expiry",
            required: false,
            span: 1
          },
          {
            label: "Account Identity Number",
            placeholder: "12345678901112",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 50,
              regex_validators: []
            },
            channel_property: "account_identity_number",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "CIMB_DIRECT_DEBIT",
        pm_type: "DIRECT_DEBIT",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/CIMB_DIRECT_DEBIT.svg",
        form: [
          {
            label: "Account Email",
            placeholder: "payments@example.com",
            type: { name: "email" },
            channel_property: "account_email",
            required: false,
            span: 2
          },
          {
            label: "Account Mobile Number",
            placeholder: "+6281234567890",
            type: { name: "phone_number" },
            channel_property: "account_mobile_number",
            required: false,
            span: 2
          },
          {
            label: "Card Last Four",
            placeholder: "1234",
            type: {
              name: "generic_numeric",
              min_length: 4,
              max_length: 4
            },
            channel_property: "card_last_four",
            required: false,
            span: 1
          },
          {
            label: "Card Expiry",
            placeholder: "06/24",
            type: { name: "credit_card_expiry" },
            channel_property: "card_expiry",
            required: false,
            span: 1
          },
          {
            label: "Account Identity Number",
            placeholder: "12345678901112",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 50,
              regex_validators: []
            },
            channel_property: "account_identity_number",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "JENIUSPAY",
        pm_type: "EWALLET",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/JENIUSPAY.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "DANA",
        pm_type: "EWALLET",
        logo_url: "https://assets.xendit.co/payment-session/logos/DANA.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "INDOMARET",
        pm_type: "OVER_THE_COUNTER",
        logo_url:
          "https://assets.xendit.co/payment-session/logos/INDOMARET.svg",
        form: [
          {
            label: "Payment Code",
            placeholder: "A1B2C3",
            type: {
              name: "generic_text",
              min_length: 6,
              max_length: 6,
              regex_validators: [
                {
                  regex: "^[A-Z0-9]{6}$",
                  message: "Must be 6 alphanumeric characters"
                }
              ]
            },
            channel_property: "payment_code",
            required: false,
            span: 1
          },
          {
            label: "Payer Name",
            placeholder: "John Doe",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 100,
              regex_validators: []
            },
            channel_property: "payer_name",
            required: true,
            span: 2
          },
          {
            label: "Display Name",
            placeholder: "John D.",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 100,
              regex_validators: []
            },
            channel_property: "display_name",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "NEXCASH",
        pm_type: "EWALLET",
        logo_url: "https://assets.xendit.co/payment-session/logos/NEXCASH.svg",
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "generic_dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" }
              ]
            },
            channel_property: "redeem_points",
            required: false,
            span: 2
          }
        ]
      },
      {
        channel_code: "ALFAMART",
        pm_type: "OVER_THE_COUNTER",
        logo_url: "https://assets.xendit.co/payment-session/logos/ALFAMART.svg",
        form: [
          {
            label: "Payment Code",
            placeholder: "A1B2C3",
            type: {
              name: "generic_text",
              min_length: 6,
              max_length: 6,
              regex_validators: [
                {
                  regex: "^[A-Z0-9]{6}$",
                  message: "Must be 6 alphanumeric characters"
                }
              ]
            },
            channel_property: "payment_code",
            required: false,
            span: 1
          },
          {
            label: "Payer Name",
            placeholder: "John Doe",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 100,
              regex_validators: []
            },
            channel_property: "payer_name",
            required: true,
            span: 2
          },
          {
            label: "Display Name",
            placeholder: "John D.",
            type: {
              name: "generic_text",
              min_length: 1,
              max_length: 100,
              regex_validators: []
            },
            channel_property: "display_name",
            required: false,
            span: 2
          }
        ]
      }
    ],
    payment_methods_groups: [
      {
        pm_type: "CARDS",
        group_label: "Cards",
        group_icon: "https://assets.xendit.co/payment-session/logos/CARDS.svg",
        channels: ["CARDS"]
      },
      {
        pm_type: "VIRTUAL_ACCOUNT",
        group_label: "Virtual Account",
        group_icon:
          "https://assets.xendit.co/payment-session/logos/VIRTUAL_ACCOUNT.svg",
        channels: [
          "BRI_VIRTUAL_ACCOUNT",
          "HANA_VIRTUAL_ACCOUNT",
          "BJB_VIRTUAL_ACCOUNT",
          "BCA_VIRTUAL_ACCOUNT",
          "BNI_VIRTUAL_ACCOUNT",
          "BSI_VIRTUAL_ACCOUNT",
          "MANDIRI_VIRTUAL_ACCOUNT",
          "CIMB_VIRTUAL_ACCOUNT",
          "BNC_VIRTUAL_ACCOUNT",
          "MUAMALAT_VIRTUAL_ACCOUNT",
          "SAHABAT_SAMPOERNA_VIRTUAL_ACCOUNT",
          "PERMATA_VIRTUAL_ACCOUNT"
        ]
      },
      {
        pm_type: "EWALLET",
        group_label: "E-Wallet",
        group_icon:
          "https://assets.xendit.co/payment-session/logos/EWALLET.svg",
        channels: [
          "SHOPEEPAY",
          "OVO",
          "ASTRAPAY",
          "LINKAJA",
          "JENIUSPAY",
          "DANA",
          "NEXCASH"
        ]
      },
      {
        pm_type: "QR_CODE",
        group_label: "QR Code",
        group_icon:
          "https://assets.xendit.co/payment-session/logos/QR_CODE.svg",
        channels: ["LINKAJA_QR_CODE", "XENDIT_QR_CODE", "DANA_QR_CODE"]
      },
      {
        pm_type: "DIRECT_DEBIT",
        group_label: "Direct Debit",
        group_icon:
          "https://assets.xendit.co/payment-session/logos/DIRECT_DEBIT.svg",
        channels: [
          "BRI_DIRECT_DEBIT",
          "MANDIRI_DIRECT_DEBIT",
          "CIMB_DIRECT_DEBIT"
        ]
      },
      {
        pm_type: "OVER_THE_COUNTER",
        group_label: "Over the Counter",
        group_icon:
          "https://assets.xendit.co/payment-session/logos/OVER_THE_COUNTER.svg",
        channels: ["INDOMARET", "ALFAMART"]
      }
    ]
  };
}
