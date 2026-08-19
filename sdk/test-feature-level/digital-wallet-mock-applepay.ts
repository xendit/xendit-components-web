const MockApplePayDoNothing = class ApplePaySession {
  static supportsVersion = (_version: number) => true;
  static canMakePayments = () => true;
  static STATUS_SUCCESS = 0;
  onvalidatemerchant:
    | ((event: ApplePayJS.ApplePayValidateMerchantEvent) => void)
    | null = null;
  onpaymentauthorized:
    | ((event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => void)
    | null = null;
  oncancel: ((event: Event) => void) | null = null;
  begin() {
    Promise.resolve().then(() => {
      this.onvalidatemerchant?.({
        validationURL: "https://apple-pay-gateway.apple.com/validate",
      } as ApplePayJS.ApplePayValidateMerchantEvent);
    });
  }
  completeMerchantValidation(_merchantSession: unknown) {}
  completePayment(_status: number) {}
  abort() {}
};

const MockApplePaySuccess = class ApplePaySession {
  static supportsVersion = (_version: number) => true;
  static canMakePayments = () => true;
  static STATUS_SUCCESS = 0;
  onvalidatemerchant:
    | ((event: ApplePayJS.ApplePayValidateMerchantEvent) => void)
    | null = null;
  onpaymentauthorized:
    | ((event: ApplePayJS.ApplePayPaymentAuthorizedEvent) => void)
    | null = null;
  oncancel: ((event: Event) => void) | null = null;
  begin() {
    Promise.resolve().then(() => {
      this.onvalidatemerchant?.({
        validationURL: "https://apple-pay-gateway.apple.com/validate",
      } as ApplePayJS.ApplePayValidateMerchantEvent);
    });
    Promise.resolve().then(() => {
      this.onpaymentauthorized?.({
        payment: {
          token: {
            paymentMethod: {
              displayName: "Visa 1234",
              network: "Visa",
              type: "debit",
            },
            transactionIdentifier: "txn-abc",
            paymentData: {},
          },
          billingContact: {},
          shippingContact: {},
        },
      } as unknown as ApplePayJS.ApplePayPaymentAuthorizedEvent);
    });
  }
  completeMerchantValidation(_merchantSession: unknown) {}
  completePayment(_status: number) {}
  abort() {}
};

export function defineMockApplepay(scenario: "do-nothing" | "success") {
  if (scenario === "do-nothing") {
    window.ApplePaySession =
      MockApplePayDoNothing as unknown as typeof ApplePaySession;
  } else {
    window.ApplePaySession =
      MockApplePaySuccess as unknown as typeof ApplePaySession;
  }

  if (!customElements.get("apple-pay-button")) {
    customElements.define("apple-pay-button", class extends HTMLElement {});
  }
}
