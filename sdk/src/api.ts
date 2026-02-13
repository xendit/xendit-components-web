import { ChannelProperties } from "./backend-types/channel";
import { BffPollResponse, BffResponse } from "./backend-types/common";
import { BffCustomer } from "./backend-types/customer";
import {
  BffPaymentRequest,
  BffPaymentToken,
} from "./backend-types/payment-entity";
import { BffCardDetails } from "./backend-types/card-details";
import { endpoint } from "./networking";
import { BffPaymentOptions } from "./backend-types/payment-options";

/**
 * Initialization method, returns session, customer, business, and channels.
 */
export const fetchSessionData = endpoint<BffResponse, string>(
  "GET",
  (sessionAuthKey) => `/api/sessions/${sessionAuthKey}`,
);

type CreatePaymentTokenRequestBody = {
  session_id: string;
  channel_code: string;
  channel_properties: ChannelProperties;
};
/**
 * Creates a payment token.
 */
export const createPaymentToken = endpoint<
  CreatePaymentTokenRequestBody,
  BffPaymentToken,
  null
>("POST", () => `/api/sessions/payment_tokens`);

type CreatePaymentRequestRequestBody = {
  session_id: string;
  channel_code: string;
  channel_properties: ChannelProperties;
  customer?: BffCustomer;
  save_payment_method?: boolean;
};
/**
 * Creates a payment request.
 */
export const createPaymentRequest = endpoint<
  CreatePaymentRequestRequestBody,
  BffPaymentRequest,
  null
>("POST", () => `/api/sessions/payment_requests`);

type SimulatePaymentRequestRequestBody = {
  channel_code: string;
};
/**
 * Simulates a payment request.
 */
export const simulatePaymentRequest = endpoint<
  SimulatePaymentRequestRequestBody,
  BffPaymentRequest,
  { sessionAuthKey: string; paymentRequestId: string }
>(
  "POST",
  (pathArg) =>
    `/api/sessions/${pathArg.sessionAuthKey}/payment_requests/${pathArg.paymentRequestId}/simulate`,
);

/**
 * Polls the session for updates.
 *
 * Always returns the session.
 * If the session is active, the payment entity will be included.
 * If the session is completed, the succeeded channel will be included.
 */
export const pollSession = endpoint<BffPollResponse, string, string | null>(
  "GET",
  (sessionAuthKey) => `/api/sessions/${sessionAuthKey}/poll`,
  (tokenRequestId) =>
    new URLSearchParams(
      tokenRequestId ? { token_request_id: tokenRequestId } : {},
    ),
);

type LookupCardDetailsRequestBody = {
  /**
   * Encrypted card number
   */
  card_number: string;
};
/**
 * Returns metadata about a card number.
 */
export const lookupCardDetails = endpoint<
  LookupCardDetailsRequestBody,
  BffCardDetails,
  string
>("POST", (sessionAuthKey) => `/api/sessions/${sessionAuthKey}/card_info`);

type GetPaymentOptionsRequest = {
  channel_code: string;
  channel_properties?: {
    card_number: string;
  };
};
/**
 * Returns metadata about a card number.
 */
export const getPaymentOptions = endpoint<
  GetPaymentOptionsRequest,
  BffPaymentOptions,
  string
>(
  "POST",
  (sessionAuthKey) => `/api/sessions/${sessionAuthKey}/payment_options`,
);
