export type BffDigitalWallets = {
  google_pay?: {
    merchant_id: string;
    allowed_payment_methods: {
      channel_code: string;
      payment_request_id: string | null;
      payment_method_specification: google.payments.api.PaymentMethodSpecification;
    }[];
  };
  apple_pay?: {
    merchant_id: "mock-applepay-merchant-id";
    apple_pay_payment_request: ApplePayJS.ApplePayPaymentRequest;
  };
};
