export type Scenarios = {
  scenarios: {
    imageUrl?: string;
    description: string;
    values: { [key: string]: string };
  }[];
  docsLink?: string;
};

export const CREDIT_CARD_SCENARIOS: Scenarios = {
  scenarios: [
    {
      values: {
        credit_card_number: "4000000000002503",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct.",
    },
    {
      values: {
        credit_card_number: "4000000000001000",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Frictionless, authentication is successful.",
    },
    {
      values: {
        credit_card_number: "5200000000002151",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct.",
    },
    {
      values: {
        credit_card_number: "5200000000001005",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Frictionless, authentication is successful.",
    },
    {
      values: {
        credit_card_number: "4440000009900010",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, see list of simulated options on the next table.",
    },
    {
      values: {
        credit_card_number: "4440000042200014",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "3DS Frictionless, authentication is successful.",
    },
    {
      values: {
        credit_card_number: "5123450000000008",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, see list of simulated options on the next table.",
    },
    {
      values: {
        credit_card_number: "5123456789012346",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "3DS Frictionless, authentication is successful.",
    },
    {
      values: {
        credit_card_number: "4200350000000801",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
    },
    {
      values: {
        credit_card_number: "5413530000000501",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description:
        "3DS Challenge, authentication is successful if OTP is correct. For frictionless flow, use amount < THB 20.",
    },
    {
      values: {
        credit_card_number: "4000000000002503",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/VISA.svg",
      description: "Failing transaction",
    },
    {
      values: {
        credit_card_number: "5200000000002151",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/MASTERCARD.svg",
      description: "Failing transaction",
    },
    {
      values: {
        credit_card_number: "3337000000000008",
        credit_card_expiry: "12/99",
        credit_card_cvn: "123",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/JCB.svg",
      description: "3DS Challenge",
    },
    {
      values: {
        credit_card_number: "378282246310005",
        credit_card_expiry: "12/99",
        credit_card_cvn: "1234",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description:
        "3DS Frictionless, authentication successful (use a 4 digit CVN)",
    },
    {
      values: {
        credit_card_number: "340000000002708",
        credit_card_expiry: "12/99",
        credit_card_cvn: "1234",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description:
        "3DS Frictionless, authentication successful (use a 4 digit CVN)",
    },
    {
      values: {
        credit_card_number: "340000000002534",
        credit_card_expiry: "12/99",
        credit_card_cvn: "1234",
      },
      imageUrl: "https://assets.xendit.co/payment-session/logos/AMEX.svg",
      description: "3DS Challenge (use a 4 digit CVN)",
    },
  ],
  docsLink: "https://docs.xendit.co/docs/testing-card-payments",
};
