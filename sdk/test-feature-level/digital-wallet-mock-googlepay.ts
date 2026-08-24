export function mockGooglepayError(
  message: string,
  statusCode: string,
): Error & { statusCode: string } {
  const error = new Error(message) as Error & { statusCode: string };
  error.statusCode = statusCode;
  return error;
}

let mockGooglePayResponse:
  | { paymentData: google.payments.api.PaymentData }
  | { error: Error & { statusCode: string } } = {
  error: mockGooglepayError("Googlepay error", "DEVELOPER_ERROR"),
};

export function setMockGooglepayNextResponse(
  response: typeof mockGooglePayResponse,
) {
  mockGooglePayResponse = response;
}

export function defineMockGooglepay() {
  window.google = {
    payments: {
      api: {
        PaymentsClient: class {
          async prefetchPaymentData() {}
          createButton(options: google.payments.api.ButtonOptions) {
            const button = document.createElement("button");
            button.textContent = "Google Pay";
            button.addEventListener("click", options.onClick);
            return button;
          }
          async isReadyToPay() {
            return { result: true };
          }
          async loadPaymentData() {
            if ("error" in mockGooglePayResponse)
              throw mockGooglePayResponse.error;
            else return mockGooglePayResponse.paymentData;
          }
        },
      },
    },
  };
}
