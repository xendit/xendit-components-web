export type BffDigitalWallets = {
  google_pay?: {
    merchant_id: string;
    allowed_payment_methods: {
      channel_code: string;
      payment_request_id: string | null;
      payment_method_specification: google.payments.api.PaymentMethodSpecification;
    }[];
  };
};
