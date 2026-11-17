import { BffBusiness } from "../../backend-types/business";
import { BffSession } from "../../backend-types/session";
import {
  createGooglePaySubmissionError,
  googlepayCancelWrapper,
  GooglePayErrorCode,
  googlepayGetConfigWrapper,
} from "../../components/digital-wallet-googlepay";
import { internal } from "../../internal";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalNeedsRerenderEvent,
} from "../../private-event-types";
import { XenditComponents } from "../../public-sdk";
import { getTelemetry } from "../../telemetry";
import { TelemetryEvents } from "../../telemetry-events";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class DigitalWalletProbeGooglePayBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  private paymentsClient: google.payments.api.PaymentsClient | null = null;

  private abortController: AbortController | null = null;

  enter() {
    assert(this.bb.digitalWalletProbeAvailable);
    assert(this.bb.world?.session);
    assert(this.bb.currentChannelCode);

    const enabledForGpay =
      this.bb.sdk[internal].options.enableDigitalWalletProbe?.digitalWallet ===
      "GOOGLE_PAY";
    const enabledForChannel =
      !this.bb.sdk[internal].options.enableDigitalWalletProbe?.channels ||
      this.bb.sdk[internal].options.enableDigitalWalletProbe?.channels.includes(
        this.bb.currentChannelCode,
      );
    const PaymentsClient = window.google?.payments?.api?.PaymentsClient;
    const gpayMerchantId =
      this.bb.world?.digitalWallets?.google_pay?.merchant_id;
    const allGpayChannels =
      this.bb.world?.digitalWallets?.google_pay?.allowed_payment_methods;
    const businessName = this.bb.world?.business.name;
    const session = this.bb.world?.session;
    const business = this.bb.world?.business;
    const isEwallet = this.bb.channel?.pm_type === "EWALLET";
    const publicChannel = this.bb.sdk.getCurrentChannel();

    // is the gpay probe possible?
    if (
      !enabledForGpay ||
      !enabledForChannel ||
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

    this.abortController = new AbortController();

    googlepayProbeAsync(
      this.bb.sdk,
      session,
      business,
      this.paymentsClient,
      selectedGpayChannel.channel_code,
      this.abortController.signal,
    )
      .then((result) => {
        if (this.abortController?.signal.aborted) {
          // dont touch anything if we already aborted
          return;
        }

        switch (result.type) {
          case "success":
            this.goToFakeSubmissionFlow();
            break;
          case "bail":
          case "canceled":
            this.bailOut();
            break;
          case "error":
            this.bailOutThenError(result.statusCode);
            break;
          default:
            this.bailOutThenError("UNKNOWN_ERROR");
        }
      })
      .catch(() => {
        if (this.abortController?.signal.aborted) {
          // dont touch anything if we already aborted
          return;
        }

        // can happen on network calls to xendit, but not on gpay errors
        this.bailOutThenError("UNKNOWN_ERROR");
      });
  }

  goToFakeSubmissionFlow() {
    this.bb.digitalWalletProbeAvailable = false;
    this.bb.useFakeSubmissionFlow = true;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }

  bailOut() {
    this.bb.digitalWalletProbeAvailable = false;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }

  bailOutThenError(statusCode: GooglePayErrorCode) {
    this.bb.digitalWalletProbeAvailable = false;
    this.bb.instantSubmissionError = createGooglePaySubmissionError(
      statusCode,
      this.bb.sdk.t,
    );

    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }

  exit() {
    this.abortController?.abort();
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }
}

type GooglePayProbeResult =
  | { type: "success" }
  | { type: "bail" }
  | { type: "canceled" }
  | { type: "error"; statusCode: GooglePayErrorCode };

async function googlepayProbeAsync(
  sdk: XenditComponents,
  session: BffSession,
  business: BffBusiness,
  paymentsClient: google.payments.api.PaymentsClient,
  channelCode: string,
  abortSignal: AbortSignal,
): Promise<GooglePayProbeResult> {
  const googlePayDataWithEwallets = await googlepayGetConfigWrapper(
    sdk,
    abortSignal,
  );
  assert(googlePayDataWithEwallets.google_pay);

  const selectedPaymentMethod =
    googlePayDataWithEwallets.google_pay.allowed_payment_methods.find(
      (method) => method.channel_code === channelCode,
    );
  assert(selectedPaymentMethod);

  const googlePayPayload: google.payments.api.PaymentDataRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    emailRequired: true,
    merchantInfo: {
      merchantId: googlePayDataWithEwallets.google_pay.merchant_id,
      merchantName: business.name ?? "",
    },
    allowedPaymentMethods: [selectedPaymentMethod.payment_method_specification],
    transactionInfo: {
      transactionId: session.payment_session_id,
      totalPriceStatus: "FINAL",
      totalPrice: String(session.amount),
      currencyCode: session.currency,
      countryCode: session.country,
    },
  };

  let readyResponse: google.payments.api.IsReadyToPayResponse;
  try {
    readyResponse = await paymentsClient.isReadyToPay({
      apiVersion: googlePayPayload.apiVersion,
      apiVersionMinor: googlePayPayload.apiVersionMinor,
      allowedPaymentMethods:
        googlePayDataWithEwallets.google_pay.allowed_payment_methods.map(
          (method) => method.payment_method_specification,
        ),
      existingPaymentMethodRequired: true,
    });
  } catch {
    return { type: "error", statusCode: "UNKNOWN_ERROR" };
  }

  if (abortSignal.aborted) return { type: "bail" };

  // not ready to pay, usually because ewallet channels aren't available in desktop mode
  if (!readyResponse.result) {
    return { type: "bail" };
  }

  // user doesn't have this payment method linked
  if (!readyResponse.paymentMethodPresent) {
    console.warn(
      "Attempted to trigger GooglePay probe, but paymentMethodPresent was false",
    );
    return { type: "bail" };
  }

  const telemetryScope = getTelemetry(sdk).appendAndPushScope(
    TelemetryEvents.DigitalWalletBegin(true, "GOOGLE_PAY"),
  );

  try {
    // we don't care about the response body
    await paymentsClient.loadPaymentData(googlePayPayload);
    getTelemetry(sdk).append(TelemetryEvents.DigitalWalletClose(true));
  } catch (err) {
    const statusCode =
      ((err as { statusCode?: string }).statusCode as
        | GooglePayErrorCode
        | "CANCELED") ?? "UNKNOWN_ERROR";

    getTelemetry(sdk).append(
      TelemetryEvents.DigitalWalletClose(false, statusCode),
    );

    // need to be VERY CAREFUL here or there will be doublepayment
    // We don't know if the request was sent or not, so try to cancel.
    // If the cancel endpoint returns a poll response, the payment succeeded or is pending.
    const cancelResponse = await googlepayCancelWrapper(sdk, abortSignal);
    if (cancelResponse) {
      return { type: "success" };
    }

    // the user canceled the gpay sheet and also we successfully canceled the PRs, so we can fall back to the normal flow
    if (statusCode === "CANCELED") {
      return { type: "bail" };
    }

    return { type: "error", statusCode };
  } finally {
    getTelemetry(sdk).popScope(telemetryScope);
  }

  return { type: "success" };
}
