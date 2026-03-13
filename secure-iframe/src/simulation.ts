export const simulationScenarios = [
  {
    values: {
      credit_card_number: "4000000000002503",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_visa",
  },
  {
    values: {
      credit_card_number: "4000000000001000",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_frictionless_authentication_is_successful_visa",
  },
  {
    values: {
      credit_card_number: "5200000000002151",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_mastercard",
  },
  {
    values: {
      credit_card_number: "5200000000001005",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_frictionless_authentication_is_successful_mastercard",
  },
  {
    values: {
      credit_card_number: "4440000009900010",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_challenge_with_list_of_simulated_options_visa",
  },
  {
    values: {
      credit_card_number: "4440000042200014",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_frictionless_authentication_is_successful_visa2",
  },
  {
    values: {
      credit_card_number: "5123450000000008",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_challenge_with_list_of_simulated_options_mastercard",
  },
  {
    values: {
      credit_card_number: "5123456789012346",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_frictionless_authentication_is_successful_mastercard2",
  },
  {
    values: {
      credit_card_number: "4200350000000801",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_visa",
  },
  {
    values: {
      credit_card_number: "5413530000000501",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "3_ds_challenge_authentication_is_successful_if_otp_is_correct_for_frictionless_flow_use_amount_thb_20_mastercard",
  },
  {
    values: {
      credit_card_number: "4000000000002503",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "failing_transaction_visa",
  },
  {
    values: {
      credit_card_number: "5200000000002151",
      credit_card_expiry: "12/99",
      credit_card_cvn: "123",
    },
    name: "failing_transaction_mastercard",
  },
  {
    values: {
      credit_card_number: "378282246310005",
      credit_card_expiry: "12/99",
      credit_card_cvn: "1234",
    },
    name: "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn",
  },
  {
    values: {
      credit_card_number: "340000000002708",
      credit_card_expiry: "12/99",
      credit_card_cvn: "1234",
    },
    name: "3_ds_frictionless_authentication_successful_use_a_4_digit_cvn2",
  },
  {
    values: {
      credit_card_number: "340000000002534",
      credit_card_expiry: "12/99",
      credit_card_cvn: "1234",
    },
    name: "3_ds_challenge_use_a_4_digit_cvn",
  },
];
