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
  | { error: Error & { statusCode: string } }
  | { pending: Promise<google.payments.api.PaymentData> } = {
  error: mockGooglepayError("Googlepay error", "DEVELOPER_ERROR"),
};

export function setMockGooglepayNextResponse(
  response:
    | { paymentData: google.payments.api.PaymentData }
    | { error: Error & { statusCode: string } },
) {
  mockGooglePayResponse = response;
}

/**
 * Sets gpay to return a pending promise. Call the returned resolve function to complete it.
 */
export function setMockGooglepayPending(): (
  data: google.payments.api.PaymentData,
) => void {
  let resolve: (data: google.payments.api.PaymentData) => void;
  const promise = new Promise<google.payments.api.PaymentData>((r) => {
    resolve = r;
  });
  mockGooglePayResponse = { pending: promise };
  return resolve!;
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
          async isReadyToPay(req: google.payments.api.IsReadyToPayRequest) {
            return {
              result: true,
              paymentMethodPresent: req.existingPaymentMethodRequired
                ? true
                : undefined,
            };
          }
          async loadPaymentData() {
            if ("error" in mockGooglePayResponse)
              throw mockGooglePayResponse.error;
            else if ("pending" in mockGooglePayResponse)
              return mockGooglePayResponse.pending;
            else return mockGooglePayResponse.paymentData;
          }
        },
      },
    },
  };
}
