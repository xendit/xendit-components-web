import { ChannelProperties } from "./forms-types";

export type V3Action =
  | {
      type: "PRESENT_TO_CUSTOMER" | "REDIRECT_CUSTOMER" | "API_POST_REQUEST";
      descriptor: "PAYMENT_CODE" | "QR_STRING" | "VIRTUAL_ACCOUNT_NUMBER";
      value: string;
    }
  | {
      type: "REDIRECT_CUSTOMER";
      descriptor: "WEB_URL" | "DEEPLINK_URL";
      value: string;
    }
  | {
      type: "API_POST_REQUEST";
      descriptor: "CAPTURE_PAYMENT" | "VALIDATE_OTP" | "RESEND_OTP";
      value: string;
    };

export type V3PaymentRequest = {
  payment_request_id: string;
  country: string;
  currency: string;
  business_id: string;
  reference_id: string;
  description: string;
  created: string;
  updated: string;
  status:
    | "ACCEPTING_PAYMENTS"
    | "REQUIRES_ACTION"
    | "AUTHORIZED"
    | "CANCELED"
    | "EXPIRED"
    | "SUCCEEDED"
    | "FAILED";
  capture_method: "AUTOMATIC" | "MANUAL";
  channel_code: string;
  customer_id: string;
  request_amount: number;
  channel_properties: ChannelProperties;
  type: "PAY" | "PAY_AND_SAVE" | "REUSABLE_PAYMENT_CODE";
  actions: V3Action[];
  session_token_request_id: string;
};

export type V3PaymentToken = {
  payment_token_id: string;
  business_id: string;
  customer_id: string;
  country: string;
  reference_id: string;
  currency: string;
  status:
    | "REQUIRES_ACTION"
    | "PENDING"
    | "ACTIVE"
    | "FAILED"
    | "EXPIRED"
    | "CANCELED";
  actions: V3Action[];
  created: string;
  updated: string;
  channel_properties: ChannelProperties;
  channel_code: string;
  session_token_request_id: string;
};

export function redirectCanBeHandledInIframe(
  channelProperties: ChannelProperties,
  action: V3Action
): boolean {
  return true;
}

export function pickAction(actions: V3Action[]): V3Action {
  return actions[0];
}
