export type BffSessionCaptureMethod = "AUTOMATIC" | "MANUAL";

export type BffSessionMode = "PAYMENT_LINK" | "COMPONENT" | "CARDS_SESSION_JS";

export type BffSessionType = "SAVE" | "PAY" | "AUTHORIZATION";

export type BffSessionStatus = "ACTIVE" | "COMPLETED" | "EXPIRED" | "CANCELED";

export type BffSession = {
  payment_session_id: string;
  client_key: string;
  amount: number;
  business_id: string;
  cancel_return_url: string;
  capture_method: BffSessionCaptureMethod;
  country: string;
  created: string;
  currency: string;
  customer_id: string;
  description: string;
  expires_at: string;
  locale: string;
  mode: BffSessionMode;
  payment_link_url: string;
  reference_id: string;
  session_type: BffSessionType;
  status: BffSessionStatus;
  success_return_url: string;
  updated: string;
};
