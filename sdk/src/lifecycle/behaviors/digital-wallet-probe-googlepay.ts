import {
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequestFailureCode,
  BffPaymentTokenFailureCode,
} from "../../backend-types/payment-entity";
import { BffSession } from "../../backend-types/session";
import { internal } from "../../internal";
import { TFunction } from "../../localization";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { SubmissionError } from "./submission";
import {
  getFailureCodeCopyKey,
  getPaymentEntityStatusCopyKey,
} from "../../backend-types/payment-entity";

export class DigitalWalletProbeGooglePayBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  private paymentsClient: google.payments.api.PaymentsClient | null = null;

  private aborted = false;

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
        countryCode: session.country,
      },
    };

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

export function inferSubmissionEndReason(
  session: BffSession,
  paymentEntity: BffPaymentEntity | null,
  submissionError: SubmissionError | Error | null,
  t: TFunction,
) {
  let reason: string | undefined = undefined;
  let userErrorMessage: string[] | undefined = undefined;
  let developerErrorMessage:
    | {
        type: "NETWORK_ERROR" | "ERROR" | "FAILURE";
        code: string;
      }
    | undefined = undefined;

  if (session.status !== "ACTIVE") {
    // if status is not active, that's why we ended submission
    reason = `SESSION_${session.status}`;
  } else if (
    submissionError &&
    isSubmissionError(submissionError) &&
    submissionError.code === "SESSION_EXPIRED"
  ) {
    reason = "SESSION_EXPIRED";
  } else if (
    paymentEntity &&
    (paymentEntity.entity.status === "FAILED" ||
      paymentEntity.entity.status === "CANCELED" ||
      paymentEntity.entity.status === "EXPIRED")
  ) {
    // the payment entity failed, was canceled or expired
    reason = `PAYMENT_${paymentEntity.type}_${paymentEntity.entity.status}`;
    userErrorMessage = failureCodeUserErrorMessage(
      t,
      paymentEntity.type,
      paymentEntity.entity.status,
      paymentEntity.entity.failure_code,
    );
    developerErrorMessage = {
      type: "FAILURE",
      code: paymentEntity.entity.failure_code ?? "UNKNOWN",
    };
  } else if (submissionError) {
    // there was an error during submission
    reason = "REQUEST_FAILED";
    if (isSubmissionError(submissionError)) {
      // explicit error message from the server
      userErrorMessage = submissionError.text;

      if (submissionError.code === "SESSION_NOT_ACTIVE") {
        userErrorMessage = [
          t("session_status.inactive.title"),
          t("session_status.inactive.subtext"),
        ];
      }
      developerErrorMessage = {
        type: "ERROR",
        code: submissionError.code,
      };
    } else {
      // unknown or network error
      userErrorMessage = defaultUserErrorMessage(t);
      developerErrorMessage = {
        type: "NETWORK_ERROR",
        code: "NETWORK_ERROR",
      };
    }
  }

  return {
    reason,
    userErrorMessage,
    developerErrorMessage,
  };
}

function defaultUserErrorMessage(t: TFunction): string[] {
  return [
    t("default_error.title"),
    t("default_error.message_1"),
    t("default_error.message_2"),
  ];
}

function failureCodeUserErrorMessage(
  t: TFunction,
  type: BffPaymentEntityType,
  status: "FAILED" | "EXPIRED" | "CANCELED",
  failureCode:
    | BffPaymentTokenFailureCode
    | BffPaymentRequestFailureCode
    | undefined,
): string[] {
  const title = t(getPaymentEntityStatusCopyKey(type, status, "title"));
  const subtext = failureCode
    ? t(
        getFailureCodeCopyKey(failureCode),
        t("failure_code_unknown", { failureCode }),
      )
    : t(getPaymentEntityStatusCopyKey(type, status, "subtext"));
  return [title, subtext];
}

function isSubmissionError(
  error: Error | SubmissionError,
): error is SubmissionError {
  return !("message" in error) && "text" in error && "code" in error;
}
