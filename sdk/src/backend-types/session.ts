import { ChannelProperties } from "./channel";
import { BffItem } from "./item";
import { BffSubscription } from "./subscription";

export type BffSessionCaptureMethod = "AUTOMATIC" | "MANUAL";

export type BffSessionMode = "PAYMENT_LINK" | "COMPONENTS" | "CARDS_SESSION_JS";

export type BffSessionType = "SAVE" | "PAY" | "AUTHORIZATION" | "SUBSCRIPTION";

export type BffSessionStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "PENDING"
  | "EXPIRED"
  | "CANCELED";

export type BffSessionAllowSavePaymentMethod =
  | "DISABLED"
  | "FORCED"
  | "OPTIONAL";

export type BffSession = {
  payment_session_id: string;
  components_sdk_key?: string;
  components_configuration?: {
    origins: string[];
    return_url?: string;
  };
  business_id: string;
  created: string;
  updated: string;
  reference_id: string;
  customer_id: string;
  session_type: BffSessionType;
  currency: string;
  amount: number;
  country: string;
  mode: BffSessionMode;
  channel_properties?: Record<string, ChannelProperties>;
  allowed_payment_channels?: string[];
  expires_at: string;
  locale: string;
  description?: string;
  items: BffItem[] | null;
  status: BffSessionStatus;
  payment_token_id?: string | null;
  payment_request_id?: string | null;
  payment_channel_code?: string | null;
  allow_save_payment_method?: BffSessionAllowSavePaymentMethod;
  capture_method: BffSessionCaptureMethod;
  subscription?: BffSubscription;
};
