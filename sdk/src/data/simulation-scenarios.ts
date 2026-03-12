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
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.cvn": "3_ds_frictionless_authentication_is_successful",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.cvn": "3_ds_frictionless_authentication_is_successful",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, see list of simulated options on the next table.",
      name: "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
      values: {
        "card_details.card_number":
          "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
        "card_details.cvn":
          "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.cvn": "3_ds_frictionless_authentication_is_successful",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, see list of simulated options on the next table.",
      name: "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
      values: {
        "card_details.card_number":
          "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
        "card_details.cvn":
          "3_ds_challenge_see_list_of_simulated_options_on_the_next_table",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Frictionless, authentication is successful.",
      name: "3_ds_frictionless_authentication_is_successful",
      values: {
        "card_details.card_number":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_frictionless_authentication_is_successful",
        "card_details.cvn": "3_ds_frictionless_authentication_is_successful",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
      name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
      values: {
        "card_details.card_number":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
        "card_details.cvn":
          "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "Failing transaction",
      name: "failing_transaction",
      values: {
        "card_details.card_number": "failing_transaction",
        "card_details.expiry_month__card_details.expiry_year":
          "failing_transaction",
        "card_details.cvn": "failing_transaction",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "Failing transaction",
      name: "failing_transaction",
      values: {
        "card_details.card_number": "failing_transaction",
        "card_details.expiry_month__card_details.expiry_year":
          "failing_transaction",
        "card_details.cvn": "failing_transaction",
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
  docsLink: "https://docs.xendit.co/docs/testing-card-payments",
};
