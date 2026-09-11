import { beforeEach, describe, expect, it } from "vitest";
import { XenditComponentsTest } from "../src";
import { waitForEvent, waitForTelemetryEvent } from "./utils";
import { screen } from "@testing-library/dom";
import {
  defineMockGooglepay,
  setMockGooglepayNextResponse,
} from "./digital-wallet-mock-googlepay";
import userEvent from "@testing-library/user-event";
import { defineMockApplepay } from "./digital-wallet-mock-applepay";
import { NetworkError } from "../src/networking";

beforeEach(() => {
  defineMockGooglepay();
  document.body.replaceChildren();
});

describe("digital wallets - googlepay - telemetry", () => {
  it("should fire a CHECKOUT_DIGITAL_WALLET_LOADED event when googlepay component is ready", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    document.body.appendChild(sdk.createDigitalWalletComponent("GOOGLE_PAY"));

    // should have fired the loaded event when the component is ready
    const e1 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_LOADED",
      true,
    );
    expect(e1.metadata?.digital_wallet).toBe("GOOGLE_PAY");

    // the button should be visible
    const button = await screen.findByRole("button", { name: "Google Pay" });
    expect(button).toBeInTheDocument();
  });

  it("should render fire a DIGITAL_WALLET_BEGIN event when googlepay is opened and CHECKOUT_DIGITAL_WALLET_CLOSE when closed", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    await waitForEvent(sdk, "init");

    document.body.appendChild(sdk.createDigitalWalletComponent("GOOGLE_PAY"));

    // consume the loaded event first
    await waitForTelemetryEvent(sdk, "CHECKOUT_DIGITAL_WALLET_LOADED", true);

    const button = await screen.findByRole("button", { name: "Google Pay" }); // <- this needs to be async because isReadyToPay is async
    expect(button).toBeInTheDocument();

    // click the button, it will return error
    await userEvent.click(button);

    // should have fired the begin event
    const e1 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_BEGIN",
      true,
    );
    expect(e1.metadata?.digital_wallet).toBe("GOOGLE_PAY");
    // then the close event
    const e2 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_CLOSE",
      false,
    );
    expect(e2.parent_event_id).toBe(e1.event_id);

    // again - this time succeed
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
    await userEvent.click(button);

    // should get same events, but this time successful
    const e3 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_BEGIN",
      true,
    );
    expect(e3.metadata?.digital_wallet).toBe("GOOGLE_PAY");
    const e4 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_CLOSE",
      true,
    );
    expect(e4.parent_event_id).toBe(e3.event_id);

    // begin events should be siblings
    expect(e3.parent_event_id).toBe(e1.parent_event_id);
  });
});

describe("digital wallets - applepay - telemetry", () => {
  it("should fire a CHECKOUT_DIGITAL_WALLET_LOADED event when applepay component is ready", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    defineMockApplepay("success");

    await waitForEvent(sdk, "init");

    document.body.appendChild(sdk.createDigitalWalletComponent("APPLE_PAY"));

    // should have fired the loaded event when the component is ready
    const e1 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_LOADED",
      true,
    );
    expect(e1.metadata?.digital_wallet).toBe("APPLE_PAY");

    // the button should be visible
    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
    expect(button).toBeInTheDocument();
  });

  it("should render fire a DIGITAL_WALLET_BEGIN event when googlepay is opened and CHECKOUT_DIGITAL_WALLET_CLOSE when closed", async () => {
    const sdk = new XenditComponentsTest({
      componentsSdkKey: "test-client-key",
    });

    // Make applepay that will fail
    defineMockApplepay("do-nothing");
    sdk.validateApplePayMerchant = async () => {
      throw new NetworkError({
        message: "merchant validation failed",
        error_code: "SERVER_ERROR",
      });
    };

    await waitForEvent(sdk, "init");

    document.body.appendChild(sdk.createDigitalWalletComponent("APPLE_PAY"));

    // consume the loaded event first
    await waitForTelemetryEvent(sdk, "CHECKOUT_DIGITAL_WALLET_LOADED", true);

    const button = document.querySelector(
      "apple-pay-button",
    ) as HTMLButtonElement;
    expect(button).toBeInTheDocument();

    // click the button, it will return error
    await userEvent.click(button);

    // should have fired the begin event
    const e1 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_BEGIN",
      true,
    );
    expect(e1.metadata?.digital_wallet).toBe("APPLE_PAY");
    // then the close event
    const e2 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_CLOSE",
      false,
    );
    expect(e2.parent_event_id).toBe(e1.event_id);

    // again - this time succeed
    defineMockApplepay("success");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (sdk as any).validateApplePayMerchant; // remove method override causing applepay to fail
    await userEvent.click(button);

    // should get same events, but this time successful
    const e3 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_BEGIN",
      true,
    );
    expect(e3.metadata?.digital_wallet).toBe("APPLE_PAY");
    const e4 = await waitForTelemetryEvent(
      sdk,
      "CHECKOUT_DIGITAL_WALLET_CLOSE",
      true,
    );
    expect(e4.parent_event_id).toBe(e3.event_id);

    // begin events should be siblings
    expect(e3.parent_event_id).toBe(e1.parent_event_id);
  });
});
