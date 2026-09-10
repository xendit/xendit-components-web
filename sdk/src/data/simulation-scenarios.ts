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

/**
 * The concrete card values for each simulation scenario, keyed by scenario name.
 *
 * For secure iframe fields, this mapping lives inside the iframe
 * (secure-iframe/src/simulation.ts) and the SDK only knows scenario names. For
 * non-iframe fields there is no iframe to resolve the values, so the SDK needs
 * its own copy to populate the fields directly.
 *
 * Keep this in sync with secure-iframe/src/simulation.ts.
 */
type SimulationFieldType =
  | "credit_card_number"
  | "credit_card_expiry"
  | "credit_card_cvn";

const SIMULATION_SCENARIO_VALUES: Record<
  string,
  Record<SimulationFieldType, string>
> = {
  "3_ds_challenge_authentication_is_successful_if_otp_is_correct_visa": {
    credit_card_number: "4000000000002503",
    credit_card_expiry: "12/99",
    credit_card_cvn: "123",
  },
  "3_ds_frictionless_authentication_is_successful_visa": {
    credit_card_number: "4000000000001000",
    credit_card_expiry: "12/99",
    credit_card_cvn: "123",
  },
  "3_ds_challenge_authentication_is_successful_if_otp_is_correct_mastercard": {
    credit_card_number: "5200000000002151",
    credit_card_expiry: "12/99",
    credit_card_cvn: "123",
  },
  "3_ds_frictionless_authentication_is_successful_mastercard": {
    credit_card_number: "5200000000001005",
    credit_card_expiry: "12/99",
    credit_card_cvn: "123",
  },
  "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn": {
    credit_card_number: "378282246310005",
    credit_card_expiry: "12/99",
    credit_card_cvn: "1234",
  },
  "3_ds_challenge_use_a_4_digit_cvn": {
    credit_card_number: "340000000002534",
    credit_card_expiry: "12/99",
    credit_card_cvn: "1234",
  },
};

/**
 * Resolve the concrete value for a non-iframe credit card field, given a
 * simulation scenario name and the field type. Returns null if the scenario or
 * field type is unknown.
 */
export function resolveSimulationFieldValue(
  scenarioName: string,
  fieldTypeName: string,
): string | null {
  if (
    fieldTypeName !== "credit_card_number" &&
    fieldTypeName !== "credit_card_expiry" &&
    fieldTypeName !== "credit_card_cvn"
  ) {
    return null;
  }
  return SIMULATION_SCENARIO_VALUES[scenarioName]?.[fieldTypeName] ?? null;
}

export const CARDS_SCENARIOS: Scenarios = {
  scenarios: [
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Challenge",
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
      description: "3DS Frictionless, success",
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
      description: "3DS Challenge",
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
      description: "3DS Frictionless, success",
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
    // // Doesn't work
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
    //   description: "3DS Challenge, with list of simulated options.",
    //   name: "3_ds_challenge_with_list_of_simulated_options_visa",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_challenge_with_list_of_simulated_options_visa",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_challenge_with_list_of_simulated_options_visa",
    //     "card_details.cvn":
    //       "3_ds_challenge_with_list_of_simulated_options_visa",
    //   },
    // },
    //// Duplicate //
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
    //   description: "3DS Frictionless, success",
    //   name: "3_ds_frictionless_authentication_is_successful_visa2",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_frictionless_authentication_is_successful_visa2",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_frictionless_authentication_is_successful_visa2",
    //     "card_details.cvn":
    //       "3_ds_frictionless_authentication_is_successful_visa2",
    //   },
    // },
    // // doesn't work
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
    //   description: "3DS Challenge, with list of simulated options.",
    //   name: "3_ds_challenge_with_list_of_simulated_options_mastercard",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_challenge_with_list_of_simulated_options_mastercard",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_challenge_with_list_of_simulated_options_mastercard",
    //     "card_details.cvn":
    //       "3_ds_challenge_with_list_of_simulated_options_mastercard",
    //   },
    // },
    //// Duplicate //
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
    //   description: "3DS Frictionless, success",
    //   name: "3_ds_frictionless_authentication_is_successful_mastercard2",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_frictionless_authentication_is_successful_mastercard2",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_frictionless_authentication_is_successful_mastercard2",
    //     "card_details.cvn":
    //       "3_ds_frictionless_authentication_is_successful_mastercard2",
    //   },
    // },
    // // These are only applicable to TH
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
    //   description:
    //     "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
    //   name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
    //     "card_details.cvn":
    //       "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
    //   },
    // },
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
    //   description:
    //     "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
    //   name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
    //     "card_details.cvn":
    //       "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
    //   },
    // },
    //// Failure use the same number as 3DS scenario //
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
    //   description: "Failure",
    //   name: "failing_transaction_visa",
    //   values: {
    //     "card_details.card_number": "failing_transaction_visa",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "failing_transaction_visa",
    //     "card_details.cvn": "failing_transaction_visa",
    //   },
    // },
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
    //   description: "Failure",
    //   name: "failing_transaction_mastercard",
    //   values: {
    //     "card_details.card_number": "failing_transaction_mastercard",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "failing_transaction_mastercard",
    //     "card_details.cvn": "failing_transaction_mastercard",
    //   },
    // },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description: "3DS Challenge",
      name: "3_ds_challenge_use_a_4_digit_cvn",
      values: {
        "card_details.card_number": "3_ds_challenge_use_a_4_digit_cvn",
        "card_details.expiry_month__card_details.expiry_year":
          "3_ds_challenge_use_a_4_digit_cvn",
        "card_details.cvn": "3_ds_challenge_use_a_4_digit_cvn",
      },
    },
    {
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description: "3DS Frictionless, success",
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
    //// Duplicate //
    // {
    //   imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
    //   description: "3DS Frictionless, success",
    //   name: "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
    //   values: {
    //     "card_details.card_number":
    //       "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
    //     "card_details.expiry_month__card_details.expiry_year":
    //       "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
    //     "card_details.cvn":
    //       "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
    //   },
    // },
  ],
  docsLink: "https://docs.xendit.co/docs/cards-simulate-card-scenarios",
};
