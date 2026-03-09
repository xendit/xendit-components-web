import { afterEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { screen } from "@testing-library/dom";

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

afterEach(() => {
  document.body.replaceChildren();
});

describe("channel picker digital wallet section", async () => {
  it("should render channel picker with digital wallet section", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
      enableDigitalWallets: true,
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
      enableDigitalWallets: true,
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
      enableDigitalWallets: true,
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
});
