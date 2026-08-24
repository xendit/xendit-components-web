import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForEventSequence } from "./utils";
import { screen } from "@testing-library/dom";
import { NetworkError } from "../src/networking";
import { defineMockApplepay } from "./digital-wallet-mock-applepay";
import {
  defineMockGooglepay,
  mockGooglepayError,
  setMockGooglepayNextResponse,
} from "./digital-wallet-mock-googlepay";

beforeEach(() => {
  defineMockGooglepay();
  defineMockApplepay("do-nothing");
});

afterEach(() => {
  document.body.replaceChildren();
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

    setMockGooglepayNextResponse({
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
    });

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

    setMockGooglepayNextResponse({
      error: mockGooglepayError("Googlepay error", "BUYER_ACCOUNT_ERROR"),
    });

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
    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
    expect(button).toBeInTheDocument();
  });

  it("should trigger a submission after the user authorizes payment", async () => {
    defineMockApplepay("success");

    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    document.body.appendChild(sdk.createChannelPickerComponent());

    await waitForEvent(sdk, "init");

    sdk.validateApplePayMerchant = async () => ({});

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
    button.click();

    await waitForEventSequence(sdk, [
      { name: "submission-begin" },
      { name: "payment-request-created" },
      { name: "session-complete" },
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

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
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

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
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

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
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

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
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

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
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
