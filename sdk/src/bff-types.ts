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

export type BffPaymentMethodType =
  | "CARDS"
  | "EWALLET"
  | "DIRECT_DEBIT"
  | "VIRTUAL_ACCOUNT"
  | "QR_CODE"
  | "OVER_THE_COUNTER";

export type BffPaymentMethod = {
  channel_code: string;
  logo_url: string;
  pm_type: BffPaymentMethodType;
};

export type BffPaymentMethodGroup = {
  pm_type: string;
  group_label: string;
  group_icon: string;
  channels: string[];
};

export type BffSessionCaptureMethod = "AUTOMATIC" | "MANUAL";

export type BffSessionMode = "PAYMENT_LINK" | "COMPONENT" | "CARDS_SESSION_JS";

export type BffSessionType = "SAVE" | "PAY" | "AUTHORIZATION";

export type BffSessionStatus = "ACTIVE" | "COMPLETED" | "EXPIRED" | "CANCELED";

export type BffSession = {
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
  payment_session_id: string;
  reference_id: string;
  session_type: BffSessionType;
  status: BffSessionStatus;
  success_return_url: string;
  updated: string;
};

export type BffResponse = {
  business: BffBusiness;
  customer: BffCustomer;
  payment_methods: BffPaymentMethod[];
  payment_methods_groups: BffPaymentMethodGroup[];
  session: BffSession;
};
