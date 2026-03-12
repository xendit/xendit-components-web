import { IframePopulateForSimulationEvent } from "../../../shared/types";

export type Scenarios = {
  scenarios: {
    name: string;
    imageUrl?: string;
    description: string;
    values?: {
      [key: string]: string | IframePopulateForSimulationEvent["type"];
    };
  }[];
  docsLink?: string;
};

export const CARDS_SCENARIOS: Scenarios = {
  scenarios: [
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_visa",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_visa",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_visa",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_visa",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful_visa",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful_visa",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful_visa",
        "card_details.cvn":
          "3_ds_frictionless_authentication_is_successful_visa",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_mastercard",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_mastercard",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_mastercard",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_mastercard",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful_mastercard",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful_mastercard",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful_mastercard",
        "card_details.cvn":
          "3_ds_frictionless_authentication_is_successful_mastercard",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Challenge, with list of simulated options.",
      name: "3_ds_challenge_with_list_of_simulated_options_visa",
      values: {
        "card_details.card_number":
          "3_ds_challenge_with_list_of_simulated_options_visa",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_with_list_of_simulated_options_visa",
        "card_details.cvn":
          "3_ds_challenge_with_list_of_simulated_options_visa",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful_visa2",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful_visa2",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful_visa2",
        "card_details.cvn":
          "3_ds_frictionless_authentication_is_successful_visa2",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Challenge, with list of simulated options.",
      name: "3_ds_challenge_with_list_of_simulated_options_mastercard",
      values: {
        "card_details.card_number":
          "3_ds_challenge_with_list_of_simulated_options_mastercard",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_with_list_of_simulated_options_mastercard",
        "card_details.cvn":
          "3_ds_challenge_with_list_of_simulated_options_mastercard",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful_mastercard2",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful_mastercard2",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful_mastercard2",
        "card_details.cvn":
          "3_ds_frictionless_authentication_is_successful_mastercard2",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "Failing transaction",
      name: "failing_transaction_visa",
      values: {
        "card_details.card_number": "failing_transaction_visa",
        "card_details.expiry_month__card_details.expiry_year":
          "failing_transaction_visa",
        "card_details.cvn": "failing_transaction_visa",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "Failing transaction",
      name: "failing_transaction_mastercard",
      values: {
        "card_details.card_number": "failing_transaction_mastercard",
        "card_details.expiry_month__card_details.expiry_year":
          "failing_transaction_mastercard",
        "card_details.cvn": "failing_transaction_mastercard",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/JCB.svg",
      description: "3DS Challenge",
      name: "3_ds_challenge",
      values: {
        "card_details.card_number": "3_ds_challenge",
        "card_details.expiry_month__card_details.expiry_year": "3_ds_challenge",
        "card_details.cvn": "3_ds_challenge",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description:
        "3DS Frictionless, authentication successful (use a 4 digit CVN)",
      name: "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn",
        "card_details.cvn":
          "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description:
        "3DS Frictionless, authentication successful (use a 4 digit CVN)",
      name: "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
        "card_details.cvn":
          "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description: "3DS Challenge (use a 4 digit CVN)",
      name: "3_ds_challenge_use_a_4_digit_cvn",
      values: {
        "card_details.card_number": "3_ds_challenge_use_a_4_digit_cvn",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_use_a_4_digit_cvn",
        "card_details.cvn": "3_ds_challenge_use_a_4_digit_cvn",
      },
    },
  ],
  docsLink: "https://docs.xendit.co/docs/cards-simulate-card-scenarios",
};
