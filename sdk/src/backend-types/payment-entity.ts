import { Instructions } from "./instructions";

export type BffAction =
  | {
      type: "PRESENT_TO_CUSTOMER";
      descriptor: "PAYMENT_CODE" | "QR_STRING" | "VIRTUAL_ACCOUNT_NUMBER";
      value: string;
      action_title: string;
      action_subtitle: string;
      action_graphic: string;
      instructions?: Instructions | null;
    }
  | {
      type: "REDIRECT_CUSTOMER";
      descriptor: "WEB_URL" | "DEEPLINK_URL" | "WEB_GOOGLE_PAYLINK";
      value: string;
    }
  | {
      type: "API_POST_REQUEST";
      descriptor: "CAPTURE_PAYMENT" | "VALIDATE_OTP" | "RESEND_OTP";
      value: string;
      otp?: {
        title: string;
        instructions: string;
      };
    };

export type BffPaymentTokenStatus =
  | "REQUIRES_ACTION"
  | "PENDING"
  | "ACTIVE"
  | "FAILED"
  | "EXPIRED"
  | "CANCELED";

export type BffPaymentTokenFailureCode =
  | "ACCOUNT_ALREADY_LINKED"
  | "INVALID_ACCOUNT_DETAILS"
  | "AUTHENTICATION_FAILED"
  | "CARD_DECLINED"
  | "CAPTURE_AMOUNT_EXCEEDED"
  | "INSUFFICIENT_BALANCE"
  | "ISSUER_UNAVAILABLE"
  | "CHANNEL_UNAVAILABLE"
  | "INVALID_MERCHANT_SETTINGS";

export type BffPaymentToken = {
  payment_token_id: string;
  status: BffPaymentTokenStatus;
  failure_code?: BffPaymentTokenFailureCode;
  actions: BffAction[];
  channel_code: string;
  /**
   * Only returned when the payment request is created, not on polling
   */
  session_token_request_id?: string;
};

export type BffPaymentRequestStatus =
  | "ACCEPTING_PAYMENTS"
  | "REQUIRES_ACTION"
  | "AUTHORIZED"
  | "CANCELED"
  | "EXPIRED"
  | "SUCCEEDED"
  | "FAILED";

export type BffPaymentRequestFailureCode =
  | "ACCOUNT_ACCESS_BLOCKED"
  | "INVALID_MERCHANT_SETTINGS"
  | "INVALID_ACCOUNT_DETAILS"
  | "PAYMENT_ATTEMPT_COUNTS_EXCEEDED"
  | "USER_DEVICE_UNREACHABLE"
  | "CHANNEL_UNAVAILABLE"
  | "INSUFFICIENT_BALANCE"
  | "ACCOUNT_NOT_ACTIVATED"
  | "INVALID_TOKEN"
  | "SERVER_ERROR"
  | "PARTNER_TIMEOUT_ERROR"
  | "TIMEOUT_ERROR"
  | "USER_DECLINED_PAYMENT"
  | "USER_DID_NOT_AUTHORIZE"
  | "PAYMENT_REQUEST_EXPIRED"
  | "FAILURE_DETAILS_UNAVAILABLE"
  | "EXPIRED_OTP"
  | "INVALID_OTP"
  | "PAYMENT_AMOUNT_LIMITS_EXCEEDED"
  | "OTP_ATTEMPT_COUNTS_EXCEEDED"
  | "CARD_DECLINED"
  | "DECLINED_BY_ISSUER"
  | "ISSUER_UNAVAILABLE"
  | "INVALID_CVV"
  | "DECLINED_BY_PROCESSOR"
  | "CAPTURE_AMOUNT_EXCEEDED"
  | "AUTHENTICATION_FAILED";

export type BffPaymentRequest = {
  payment_request_id: string;
  status: BffPaymentRequestStatus;
  failure_code?: BffPaymentRequestFailureCode;
  actions: BffAction[];
  channel_code: string;
  /**
   * Only returned when the payment request is created, not on polling
   */
  session_token_request_id?: string;
};

export enum BffPaymentEntityType {
  PaymentRequest = "REQUEST",
  PaymentToken = "TOKEN",
}

export type BffPaymentEntity =
  | {
      id: string;
      type: BffPaymentEntityType.PaymentRequest;
      entity: BffPaymentRequest;
    }
  | {
      id: string;
      type: BffPaymentEntityType.PaymentToken;
      entity: BffPaymentToken;
    };

export function toPaymentEntity(
  prOrPt: BffPaymentRequest | BffPaymentToken,
): BffPaymentEntity {
  if ("payment_request_id" in prOrPt) {
    return {
      id: prOrPt.payment_request_id,
      type: BffPaymentEntityType.PaymentRequest,
      entity: prOrPt,
    };
  } else {
    return {
      id: prOrPt.payment_token_id,
      type: BffPaymentEntityType.PaymentToken,
      entity: prOrPt,
    };
  }
}
