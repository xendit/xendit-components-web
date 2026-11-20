import {
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequestFailureCode,
  BffPaymentTokenFailureCode,
} from "../../backend-types/payment-entity";
import { BffSession } from "../../backend-types/session";
import { TFunction } from "../../localization";
import { SubmissionError } from "./submission";
import {
  getFailureCodeCopyKey,
  getPaymentEntityStatusCopyKey,
} from "../../backend-types/payment-entity";

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
