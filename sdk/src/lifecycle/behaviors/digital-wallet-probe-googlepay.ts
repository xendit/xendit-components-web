import { internal } from "../../internal";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class DigitalWalletProbeGooglePayBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  private paymentsClient: google.payments.api.PaymentsClient | null = null;

  private aborted = false;

  enter() {
    assert(this.bb.digitalWalletProbeAvailable);
    assert(this.bb.world?.session);

    const enabled =
      this.bb.sdk[internal].options.enableDigitalWalletProbe === "GOOGLE_PAY";
    const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
    const gpayMerchantId =
      this.bb.world?.digitalWallets?.google_pay?.merchant_id;
    const allGpayChannels = this.bb.mock
      ? this.bb.world?.digitalWallets?.google_pay
          ?.mock_ewallet_allowed_payment_methods
      : this.bb.world?.digitalWallets?.google_pay?.allowed_payment_methods;
    const businessName = this.bb.world?.business.name;
    const session = this.bb.world?.session;
    const isEwallet = this.bb.channel?.pm_type === "EWALLET";
    const publicChannel = this.bb.sdk.getCurrentChannel();

    // is the gpay probe possible?
    if (
      !enabled ||
      !isEwallet ||
      !PaymentsClient ||
      !gpayMerchantId ||
      !businessName ||
      !allGpayChannels ||
      !publicChannel
    ) {
      this.bailOut();
      return;
    }

    // does the channel the user selected have a gpay config?
    const selectedGpayChannel = allGpayChannels.find(
      (ch) => ch.channel_code === this.bb.currentChannelCode,
    );
    if (!selectedGpayChannel) {
      this.bailOut();
      return;
    }

    const isTestEnv = this.bb.sdk.isMock() || this.bb.sdk.isDevelopmentEnv();
    this.paymentsClient = new PaymentsClient({
      environment: isTestEnv ? "TEST" : "PRODUCTION",
    });

    const googlePayConfig: google.payments.api.PaymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [selectedGpayChannel.payment_method_specification],
      emailRequired: true,
      merchantInfo: {
        merchantId: gpayMerchantId,
        merchantName: businessName,
      },
      transactionInfo: {
        transactionId: session.payment_session_id,
        totalPriceStatus: "FINAL",
        totalPrice: String(session.amount),
        currencyCode: session.currency,
      },
    };

    if (this.bb.mock) {
      // skip gpay in mock mode, there is no tng
      this.bb.digitalWalletProbeAvailable = false;
      this.bb.useFakeSubmissionFlow = true;
      this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
      return;
    }

    this.paymentsClient
      .isReadyToPay({
        apiVersion: googlePayConfig.apiVersion,
        apiVersionMinor: googlePayConfig.apiVersionMinor,
        allowedPaymentMethods: googlePayConfig.allowedPaymentMethods,
        existingPaymentMethodRequired: true,
      })
      .then((response) => {
        if (this.aborted) return;

        // user has no linked payment method
        const readyToPay = response.result && response.paymentMethodPresent;
        if (!readyToPay) {
          this.bailOut();
          return;
        }

        // continue
        return this.paymentsClient?.loadPaymentData(googlePayConfig);
      })
      .then((response) => {
        if (this.aborted) return;

        if (!response?.paymentMethodData) {
          this.bailOut();
          return;
        }

        this.bb.digitalWalletProbeAvailable = false;
        this.bb.useFakeSubmissionFlow = true;
        this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
      })
      .catch((reason) => {
        // don't care what the error is, just bail
        this.bailOut();
      });
  }

  bailOut() {
    this.bb.digitalWalletProbeAvailable = false;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }

  exit() {
    this.aborted = true;
  }
}
