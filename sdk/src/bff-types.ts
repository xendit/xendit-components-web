import { Channel, ChannelUiGroup } from "./forms-types";

export type BffBusiness = {
  country_of_operation: string;
  name: string;
};

export type BffCustomerType = "INDIVIDUAL" | "BUSINESS";

export type BffCustomer = {
  id: string;
  type: BffCustomerType;
  email: string | null;
  mobile_number: string | null;
  phone_number: string | null;
  business_detail: unknown;
  individual_detail: {
    given_names: string | null;
    surname: string | null;
  } | null;
};

export type BffChannelType =
  | "CARDS"
  | "EWALLET"
  | "DIRECT_DEBIT"
  | "VIRTUAL_ACCOUNT"
  | "QR_CODE"
  | "OVER_THE_COUNTER";

export type BffChannel = Channel;

export type BffChannelUiGroup = ChannelUiGroup;

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

export type BffResponse = {
  business: BffBusiness;
  customer: BffCustomer;
  payment_methods: BffChannel[];
  payment_methods_groups: BffChannelUiGroup[];
  session: BffSession;
};
