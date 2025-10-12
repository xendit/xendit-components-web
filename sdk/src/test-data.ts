import { BffResponse, BffSession } from "./bff-types";
import { ChannelProperties } from "./forms-types";
import { V3PaymentRequest } from "./v3-types";

const examplePublicKey =
  "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEVpIgrkofEwt4eLojVyGHgqTu3DS/kKmzvNf+fS2AdkiSQYrNYdtRjY3Ga+Vif+MR6GE5g3A5r5DXP6RFTel7CoIdZ7tyylAq8pwzYbEyb7Q0KOWcifkH/ZyQVA7Gz11e";
const exampleSignature =
  "1WJcUIskN1a7MXUF6ddsjSlpQ7PXk5X47bIExisXmzxXqKColRYXVwjVVguyYiHwUyeuB908L+tEf7xbxbzDcs+0/EJGL2loKV/fyv6iWDM72+Sv5SvfOBImhfT38yB7";
const exampleEnvironment = "TEST";

export function makeTestBffData(): BffResponse {
  return {
    session: {
      payment_session_id: "ps-688adc58e506c45fd2b7f049",
      client_key: `psck-12345678901234567890-${examplePublicKey}-${exampleSignature}-${exampleEnvironment}`,
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
      payment_link_url: "https://url-shortener-ui-dev.stg.tidnex.dev/GSrBS0cX",
    },
    business: {
      name: "C.C.D.",
      country_of_operation: "Indonesia",
    },
    customer: {
      type: "INDIVIDUAL",
      id: "cust-324ee78a-d624-4868-84fc-92278a5eb86a",
      email: "app****@forter.com",
      mobile_number: "+62********8347",
      phone_number: null,
      individual_detail: {
        given_names: "joh*****",
        surname: null,
      },
      business_detail: null,
    },
    channels: [
      {
        brand_name: "BRI Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BRI_VIRTUAL_ACCOUNT.svg",
        brand_color: "#003366",
        ui_group: "virtual_account",
        channel_code: "BRI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for BRI",
          "Use this number to make payment through BRI mobile banking or ATM",
        ],
        form: [
          {
            label: "Virtual Account Number",
            placeholder: "88696969696988",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [],
            },
            channel_property: "virtual_account_number",
            required: false,
            span: 2,
          },
          {
            label: "Payer Name",
            placeholder: "John Doe",
            type: {
              name: "text",
              min_length: 1,
              max_length: 100,
              regex_validators: [],
            },
            channel_property: "payer_name",
            required: false,
            span: 2,
          },
          {
            label: "Display Name",
            placeholder: "John D.",
            type: {
              name: "text",
              min_length: 1,
              max_length: 100,
              regex_validators: [],
            },
            channel_property: "display_name",
            required: false,
            span: 2,
          },
          {
            label: "Suggested Amount",
            placeholder: "100000",
            type: { name: "text", min_length: 1, max_length: 15 },
            channel_property: "suggested_amount",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "HANA Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/HANA_VIRTUAL_ACCOUNT.svg",
        brand_color: "#FF6B35",
        ui_group: "virtual_account",
        channel_code: "HANA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for HANA Bank",
          "Use this number to make payment through HANA mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "BJB Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BJB_VIRTUAL_ACCOUNT.svg",
        brand_color: "#1E88E5",
        ui_group: "virtual_account",
        channel_code: "BJB_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for BJB",
          "Use this number to make payment through BJB mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "BCA Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BCA_VIRTUAL_ACCOUNT.svg",
        brand_color: "#0066CC",
        ui_group: "virtual_account",
        channel_code: "BCA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for BCA",
          "Use this number to make payment through BCA mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "BNI Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BNI_VIRTUAL_ACCOUNT.svg",
        brand_color: "#FF6600",
        ui_group: "virtual_account",
        channel_code: "BNI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for BNI",
          "Use this number to make payment through BNI mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "BSI Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BSI_VIRTUAL_ACCOUNT.svg",
        brand_color: "#00A651",
        ui_group: "virtual_account",
        channel_code: "BSI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for BSI",
          "Use this number to make payment through BSI mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "Mandiri Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/MANDIRI_VIRTUAL_ACCOUNT.svg",
        brand_color: "#003366",
        ui_group: "virtual_account",
        channel_code: "MANDIRI_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for Mandiri",
          "Use this number to make payment through Mandiri mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "CIMB Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/CIMB_VIRTUAL_ACCOUNT.svg",
        brand_color: "#DC143C",
        ui_group: "virtual_account",
        channel_code: "CIMB_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for CIMB Niaga",
          "Use this number to make payment through CIMB mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "BNC Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BNC_VIRTUAL_ACCOUNT.svg",
        brand_color: "#0066CC",
        ui_group: "virtual_account",
        channel_code: "BNC_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for BNC",
          "Use this number to make payment through BNC mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "Muamalat Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/MUAMALAT_VIRTUAL_ACCOUNT.svg",
        brand_color: "#00A651",
        ui_group: "virtual_account",
        channel_code: "MUAMALAT_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for Muamalat",
          "Use this number to make payment through Muamalat mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "Sahabat Sampoerna Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/SAHABAT_SAMPOERNA_VIRTUAL_ACCOUNT.svg",
        brand_color: "#FF6B35",
        ui_group: "virtual_account",
        channel_code: "SAHABAT_SAMPOERNA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for Sahabat Sampoerna",
          "Use this number to make payment through Sahabat Sampoerna mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "Permata Virtual Account",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/PERMATA_VIRTUAL_ACCOUNT.svg",
        brand_color: "#0066CC",
        ui_group: "virtual_account",
        channel_code: "PERMATA_VIRTUAL_ACCOUNT",
        pm_type: "VIRTUAL_ACCOUNT",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a virtual account number for Permata Bank",
          "Use this number to make payment through Permata mobile banking or ATM",
        ],
        form: [],
      },
      {
        brand_name: "Cards",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/CARDS.svg",
        brand_color: "#1976D2",
        ui_group: "cards",
        channel_code: "CARDS",
        pm_type: "CARDS",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "Your payment will be processed securely using your card details",
          "You may be redirected to your bank's 3D Secure page for verification",
        ],
        card: {
          brands: [
            {
              name: "VISA",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/VISA.svg",
            },
            {
              name: "VISA_ELECTRON",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/VISA_ELECTRON.svg",
            },
            {
              name: "MASTERCARD",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
            },
            {
              name: "AMEX",
              logo_url:
                "https://assets.xendit.co/payment-session/logos/AMEX.svg",
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
            label: "Card Number",
            placeholder: "4111 1111 1111 1111",
            type: { name: "credit_card_number" },
            channel_property: "card_details.card_number",
            required: true,
            span: 2,
          },
          {
            label: "Expiry",
            placeholder: "12/28",
            type: { name: "credit_card_expiry" },
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
            placeholder: "123",
            type: { name: "credit_card_cvn" },
            channel_property: "card_details.cvn",
            required: true,
            span: 1,
            join: true,
          },
          {
            label: "Cardholder Name",
            placeholder: "John Doe",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [],
            },
            channel_property: "card_details.cardholder_name",
            required: true,
            span: 2,
          },
          {
            label: "Cardholder Email",
            placeholder: "john.doe@example.com",
            type: { name: "email" },
            channel_property: "card_details.cardholder_email",
            required: true,
            span: 2,
          },
          {
            label: "Cardholder Phone",
            placeholder: "+1234567890",
            type: { name: "phone_number" },
            channel_property: "card_details.cardholder_phone_number",
            required: false,
            span: 2,
          },
          {
            label: "Postal/ZIP Code",
            placeholder: "",
            type: {
              name: "postal_code",
            },
            channel_property: "card_details.postal_code",
            required: true,
            span: 1,
          },
        ],
      },
      {
        brand_name: "ShopeePay",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/SHOPEEPAY.svg",
        brand_color: "#EE4D2D",
        ui_group: "ewallet",
        channel_code: "SHOPEEPAY",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to ShopeePay's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
          {
            label: "Allowed Payment Options",
            placeholder: "Pay Later Postpaid",
            type: {
              name: "dropdown",
              options: [
                {
                  label: "Pay Later Postpaid",
                  subtitle: "Pay next month",
                  value: "PAYLATER_POSTPAID",
                },
                {
                  label: "Pay Later Installments",
                  subtitle: "Pay with installments",
                  value: "PAYLATER_INSTALLMENTS_4MO",
                },
              ],
            },
            channel_property: "allowed_payment_options",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "OVO",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/OVO.svg",
        brand_color: "#4C2C92",
        ui_group: "ewallet",
        channel_code: "OVO",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to OVO's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "BRI Direct Debit",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/BRI_DIRECT_DEBIT.svg",
        brand_color: "#003366",
        ui_group: "direct_debit",
        channel_code: "BRI_DIRECT_DEBIT",
        pm_type: "DIRECT_DEBIT",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to BRI's secure authentication page",
          "Complete the authentication to authorize the direct debit payment",
        ],
        form: [
          {
            label: "Account Email",
            placeholder: "payments@example.com",
            type: { name: "email" },
            channel_property: "account_email",
            required: false,
            span: 2,
          },
          {
            label: "Account Mobile Number",
            placeholder: "+6281234567890",
            type: { name: "phone_number" },
            channel_property: "account_mobile_number",
            required: false,
            span: 2,
          },
          {
            label: "Card Last Four",
            placeholder: "1234",
            type: {
              name: "text",
              min_length: 4,
              max_length: 4,
            },
            channel_property: "card_last_four",
            required: false,
            span: 1,
          },
          {
            label: "Card Expiry",
            placeholder: "06/24",
            type: { name: "text", max_length: 5 },
            channel_property: "card_expiry",
            required: false,
            span: 1,
          },
          {
            label: "Account Identity Number",
            placeholder: "12345678901112",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [],
            },
            channel_property: "account_identity_number",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "QRIS",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/QRIS.svg",
        brand_color: "#000000",
        ui_group: "qr_code",
        channel_code: "QRIS",
        pm_type: "QR_CODE",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a QR code to scan with any QRIS-enabled app",
          "Scan the code using your preferred e-wallet or banking app",
        ],
        form: [],
      },
      {
        brand_name: "AstraPay",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/ASTRAPAY.svg",
        brand_color: "#0066CC",
        ui_group: "ewallet",
        channel_code: "ASTRAPAY",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll be redirected to AstraPay's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "LinkAja",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/LINKAJA.svg",
        brand_color: "#E60012",
        ui_group: "ewallet",
        channel_code: "LINKAJA",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll be redirected to LinkAja's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "Mandiri Direct Debit",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/MANDIRI_DIRECT_DEBIT.svg",
        brand_color: "#003366",
        ui_group: "direct_debit",
        channel_code: "MANDIRI_DIRECT_DEBIT",
        pm_type: "DIRECT_DEBIT",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to Mandiri's secure authentication page",
          "Complete the authentication to authorize the direct debit payment",
        ],
        form: [
          {
            label: "Account Email",
            placeholder: "payments@example.com",
            type: { name: "email" },
            channel_property: "account_email",
            required: false,
            span: 2,
          },
          {
            label: "Account Mobile Number",
            placeholder: "+6281234567890",
            type: { name: "phone_number" },
            channel_property: "account_mobile_number",
            required: false,
            span: 2,
          },
          {
            label: "Card Last Four",
            placeholder: "1234",
            type: {
              name: "text",
              min_length: 4,
              max_length: 4,
            },
            channel_property: "card_last_four",
            required: false,
            span: 1,
          },
          {
            label: "Card Expiry",
            placeholder: "06/24",
            type: { name: "text", max_length: 5 },
            channel_property: "card_expiry",
            required: false,
            span: 1,
          },
          {
            label: "Account Identity Number",
            placeholder: "12345678901112",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [],
            },
            channel_property: "account_identity_number",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "CIMB Direct Debit",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/CIMB_DIRECT_DEBIT.svg",
        brand_color: "#DC143C",
        ui_group: "direct_debit",
        channel_code: "CIMB_DIRECT_DEBIT",
        pm_type: "DIRECT_DEBIT",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to CIMB's secure authentication page",
          "Complete the authentication to authorize the direct debit payment",
        ],
        form: [
          {
            label: "Account Email",
            placeholder: "payments@example.com",
            type: { name: "email" },
            channel_property: "account_email",
            required: false,
            span: 2,
          },
          {
            label: "Account Mobile Number",
            placeholder: "+6281234567890",
            type: { name: "phone_number" },
            channel_property: "account_mobile_number",
            required: false,
            span: 2,
          },
          {
            label: "Card Last Four",
            placeholder: "1234",
            type: {
              name: "text",
              min_length: 4,
              max_length: 4,
            },
            channel_property: "card_last_four",
            required: false,
            span: 1,
          },
          {
            label: "Card Expiry",
            placeholder: "06/24",
            type: { name: "text", max_length: 5 },
            channel_property: "card_expiry",
            required: false,
            span: 1,
          },
          {
            label: "Account Identity Number",
            placeholder: "12345678901112",
            type: {
              name: "text",
              min_length: 1,
              max_length: 50,
              regex_validators: [],
            },
            channel_property: "account_identity_number",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "JENIUSPAY",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/JENIUSPAY.svg",
        brand_color: "#0066CC",
        ui_group: "ewallet",
        channel_code: "JENIUSPAY",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll be redirected to JENIUSPAY's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "DANA",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/DANA.svg",
        brand_color: "#118EEA",
        ui_group: "ewallet",
        channel_code: "DANA",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to DANA's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "Indomaret",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/INDOMARET.svg",
        brand_color: "#0066CC",
        ui_group: "over_the_counter",
        channel_code: "INDOMARET",
        pm_type: "OVER_THE_COUNTER",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a payment code to use at Indomaret stores",
          "Visit any Indomaret store and provide the payment code to complete your payment",
        ],
        form: [
          {
            label: "Payment Code",
            placeholder: "A1B2C3",
            type: {
              name: "text",
              min_length: 6,
              max_length: 6,
              regex_validators: [
                {
                  regex: "^[A-Z0-9]{6}$",
                  message: "Must be 6 alphanumeric characters",
                },
              ],
            },
            channel_property: "payment_code",
            required: false,
            span: 1,
          },
          {
            label: "Payer Name",
            placeholder: "John Doe",
            type: {
              name: "text",
              min_length: 1,
              max_length: 100,
              regex_validators: [],
            },
            channel_property: "payer_name",
            required: true,
            span: 2,
          },
          {
            label: "Display Name",
            placeholder: "John D.",
            type: {
              name: "text",
              min_length: 1,
              max_length: 100,
              regex_validators: [],
            },
            channel_property: "display_name",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "NEXCASH",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/NEXCASH.svg",
        brand_color: "#0066CC",
        ui_group: "ewallet",
        channel_code: "NEXCASH",
        pm_type: "EWALLET",
        one_time_payment: true,
        save_payment_information: true,
        instructions: [
          "You'll be redirected to NEXCASH's page",
          "Follow the prompts on the page to complete your payment",
        ],
        form: [
          {
            label: "Redeem Points",
            placeholder: "No points redemption",
            type: {
              name: "dropdown",
              options: [
                { label: "No points redemption", value: "REDEEM_NONE" },
                { label: "Redeem all points", value: "REDEEM_ALL" },
              ],
            },
            channel_property: "redeem_points",
            required: false,
            span: 2,
          },
        ],
      },
      {
        brand_name: "Alfamart",
        brand_logo_url:
          "https://assets.xendit.co/payment-session/logos/ALFAMART.svg",
        brand_color: "#0066CC",
        ui_group: "over_the_counter",
        channel_code: "ALFAMART",
        pm_type: "OVER_THE_COUNTER",
        one_time_payment: true,
        save_payment_information: false,
        instructions: [
          "You'll receive a payment code to use at Alfamart stores",
          "Visit any Alfamart store and provide the payment code to complete your payment",
        ],
        form: [
          {
            label: "Payment Code",
            placeholder: "A1B2C3",
            type: {
              name: "text",
              min_length: 6,
              max_length: 6,
              regex_validators: [
                {
                  regex: "^[A-Z0-9]{6}$",
                  message: "Must be 6 alphanumeric characters",
                },
              ],
            },
            channel_property: "payment_code",
            required: false,
            span: 1,
          },
          {
            label: "Payer Name",
            placeholder: "John Doe",
            type: {
              name: "text",
              min_length: 1,
              max_length: 100,
              regex_validators: [],
            },
            channel_property: "payer_name",
            required: true,
            span: 2,
          },
          {
            label: "Display Name",
            placeholder: "John D.",
            type: {
              name: "text",
              min_length: 1,
              max_length: 100,
              regex_validators: [],
            },
            channel_property: "display_name",
            required: false,
            span: 2,
          },
        ],
      },
    ],
    channel_ui_groups: [
      {
        id: "cards",
        label: "Cards",
        icon_url: "https://assets.xendit.co/payment-session/logos/CARDS.svg",
      },
      {
        id: "virtual_account",
        label: "Virtual Account",
        icon_url:
          "https://assets.xendit.co/payment-session/logos/VIRTUAL_ACCOUNT.svg",
      },
      {
        id: "ewallet",
        label: "E-Wallet",
        icon_url: "https://assets.xendit.co/payment-session/logos/EWALLET.svg",
      },
      {
        id: "qr_code",
        label: "QR Code",
        icon_url: "https://assets.xendit.co/payment-session/logos/QR_CODE.svg",
      },
      {
        id: "direct_debit",
        label: "Direct Debit",
        icon_url:
          "https://assets.xendit.co/payment-session/logos/DIRECT_DEBIT.svg",
      },
      {
        id: "over_the_counter",
        label: "Over the Counter",
        icon_url:
          "https://assets.xendit.co/payment-session/logos/OVER_THE_COUNTER.svg",
      },
    ],
  };
}

function makeTestRandomId() {
  return Math.random().toString(36).substring(2, 15);
}

export function makeTestV3PaymentRequest(
  session: BffSession,
  channelCode: string,
  channelProperties: ChannelProperties,
): V3PaymentRequest {
  return {
    payment_request_id: `pr-${makeTestRandomId()}`,
    country: session.country,
    currency: session.currency,
    business_id: session.business_id,
    reference_id: session.reference_id,
    description: session.description,
    created: Date.now().toString(),
    updated: Date.now().toString(),
    status: "REQUIRES_ACTION",
    capture_method: "AUTOMATIC",
    channel_code: channelCode,
    customer_id: session.customer_id,
    request_amount: session.amount,
    channel_properties: channelProperties,
    type: "PAY",
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
