import { afterEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { screen } from "@testing-library/dom";
import { NetworkError } from "../src/networking";

function errorWithStatusCode(
  message: string,
  statusCode: string,
): Error & { statusCode: string } {
  const error = new Error(message) as Error & { statusCode: string };
  error.statusCode = statusCode;
  return error;
}

// googlepay mock responses
let mockGooglePayResponse:
  | { paymentData: google.payments.api.PaymentData }
  | { error: Error & { statusCode: string } } = {
  error: errorWithStatusCode("Googlepay error", "DEVELOPER_ERROR"),
};

// mock googlepay
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

// mock applepay
window.ApplePaySession = class {
  static supportsVersion(_version: number) {
    return true;
  }
  static canMakePayments() {
    return true;
  }
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
} as unknown as typeof ApplePaySession;

if (!customElements.get("apple-pay-button")) {
  customElements.define("apple-pay-button", class extends HTMLElement {});
}

afterEach(() => {
  document.body.replaceChildren();
  window.ApplePaySession = class {
    static supportsVersion(_version: number) {
      return true;
    }
    static canMakePayments() {
      return true;
    }
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
  } as unknown as typeof ApplePaySession;
});

describe("channel picker digital wallet section - Google Pay", async () => {
  it("should render channel picker with digital wallet section", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    const el = document.body.querySelector("xendit-channel-picker");
    expect(el).toBeEmptyDOMElement();

    await waitForEvent(sdk, "init");

    const button = await screen.findByRole("button", { name: "Google Pay" }); // <- this needs to be async because isReadyToPay is async
    expect(button).toBeInTheDocument();
  });

  it("should trigger a submission by clicking the button", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    const el = document.body.querySelector("xendit-channel-picker");
    expect(el).toBeEmptyDOMElement();

    await waitForEvent(sdk, "init");

    mockGooglePayResponse = {
      paymentData: {
        apiVersion: 2,
        apiVersionMinor: 0,
        paymentMethodData: {
          type: "CARD",
          description: "Visa ending in 1234",
          info: {
            cardNetwork: "VISA",
            cardDetails: "1234",
          },
          tokenizationData: {
            type: "PAYMENT_GATEWAY",
            token: "{}",
          },
        },
      },
    };

    const button = await screen.findByRole("button", { name: "Google Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "action-begin" }, // <- it should have triggered mock 3ds
    ]);
  });

  it("should trigger a submission by clicking the button (with error)", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    const el = document.body.querySelector("xendit-channel-picker");
    expect(el).toBeEmptyDOMElement();

    await waitForEvent(sdk, "init");

    mockGooglePayResponse = {
      error: errorWithStatusCode("Googlepay error", "BUYER_ACCOUNT_ERROR"),
    };

    const button = await screen.findByRole("button", { name: "Google Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      {
        name: "submission-end",
        expectedKeys: {
          reason: "REQUEST_FAILED",
          developerErrorMessage: { code: "GOOGLE_PAY_BUYER_ACCOUNT_ERROR" },
        },
      },
    ]);
  });

  it("getActiveDigitalWallets returns the configured wallets", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const wallets = sdk.getActiveDigitalWallets();

    const googlePay = wallets.find(
      (wallet) => wallet.digitalWalletCode === "GOOGLE_PAY",
    );
    expect(googlePay?.channels.length ?? 0).toBeGreaterThan(0);
  });
});

describe("channel picker digital wallet section - Apple Pay", async () => {
  it("should render channel picker with Apple Pay button", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");
    const button = screen.getByRole("button", { name: "Apple Pay" });
    expect(button).toBeInTheDocument();
  });

  it("should trigger a submission after the user authorizes payment", async () => {
    window.ApplePaySession = class {
      static supportsVersion(_version: number) {
        return true;
      }
      static canMakePayments() {
        return true;
      }
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
    } as unknown as typeof ApplePaySession;

    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    sdk.validateApplePayMerchant = async () => ({});

    const button = screen.getByRole("button", { name: "Apple Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "action-begin" }, // mock 3DS triggered for the CARDS channel
    ]);
  });

  it("should emit submission-end with APPLE_PAY_MERCHANT_VALIDATION_FAILED when merchant validation fails", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // Make validateApplePayMerchant throw a NetworkError.
    sdk.validateApplePayMerchant = async () => {
      throw new NetworkError({
        message: "merchant validation failed",
        error_code: "SERVER_ERROR",
      });
    };

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const button = screen.getByRole("button", { name: "Apple Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      {
        name: "submission-end",
        expectedKeys: {
          reason: "REQUEST_FAILED",
          developerErrorMessage: {
            code: "APPLE_PAY_MERCHANT_VALIDATION_FAILED",
          },
        },
      },
    ]);

    alertSpy.mockRestore();
  });

  it("should emit submission-end with APPLE_PAY_NETWORK_ERROR when merchant validation fails with a non-network error", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // Make validateApplePayMerchant throw a plain error (not a NetworkError).
    sdk.validateApplePayMerchant = async () => {
      throw new Error("something went wrong");
    };

    const button = screen.getByRole("button", { name: "Apple Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      {
        name: "submission-end",
        expectedKeys: {
          reason: "REQUEST_FAILED",
          developerErrorMessage: { code: "APPLE_PAY_NETWORK_ERROR" },
        },
      },
    ]);
  });

  it("should alert in test environments when merchant validation fails", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    sdk.validateApplePayMerchant = async () => {
      throw new NetworkError({
        message: "merchant validation failed",
        error_code: "SERVER_ERROR",
      });
    };

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const button = screen.getByRole("button", { name: "Apple Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "submission-end" },
    ]);

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0][0]).toContain("sandbox");

    alertSpy.mockRestore();
  });

  it("should not alert when merchant validation fails on a live session", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // Simulate a live (non-test) session, where this alert must never appear in front of a real customer.
    sdk.isMock = () => false;
    sdk.isDevelopmentEnv = () => false;
    sdk.validateApplePayMerchant = async () => {
      throw new NetworkError({
        message: "merchant validation failed",
        error_code: "SERVER_ERROR",
      });
    };

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const button = screen.getByRole("button", { name: "Apple Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "submission-end" },
    ]);

    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("should not alert when the request never reached the server", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    // A plain error means the request never got a structured response back, the failure is a network or CORS problem rather than anything Apple said.
    sdk.validateApplePayMerchant = async () => {
      throw new Error("failed to fetch");
    };

    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const button = screen.getByRole("button", { name: "Apple Pay" });
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "submission-end" },
    ]);

    expect(alertSpy).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it("getActiveDigitalWallets returns Apple Pay mapped to the CARDS channel", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    const wallets = sdk.getActiveDigitalWallets();

    const applePay = wallets.find(
      (wallet) => wallet.digitalWalletCode === "APPLE_PAY",
    );
    expect(applePay?.channels.length ?? 0).toBeGreaterThan(0);
    expect(applePay?.channels[0].channelCode).toBe("CARDS");
  });
});
