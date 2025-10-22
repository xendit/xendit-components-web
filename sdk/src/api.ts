import { ChannelProperties } from "./backend-types/channel";
import { BffPollResponse, BffResponse } from "./backend-types/common";
import { BffCustomer } from "./backend-types/customer";
import {
  BffPaymentRequest,
  BffPaymentToken,
} from "./backend-types/payment-entity";
import { BffCardDetails } from "./backend-types/card-details";
import { endpoint } from "./networking";

/**
 * Initialization method, returns session, customer, business, and channels.
 */
export const fetchSessionData = endpoint<undefined, BffResponse, string>(
  "GET",
  (sessionAuthKey) => `/api/session/${sessionAuthKey}`,
);

type CreatePaymentTokenRequestBody = {
  session_id: string;
  channel_code?: string;
  channel_properties: Record<string, unknown>;
};
/**
 * Creates a payment token.
 */
export const createPaymentToken = endpoint<
  CreatePaymentTokenRequestBody,
  BffPaymentToken,
  string
>("POST", () => `/api/sessions/payment_tokens`);

type CreatePaymentRequestRequestBody = {
  session_id: string;
  channel_code?: string;
  channel_properties: ChannelProperties;
  customer?: BffCustomer;
};
/**
 * Creates a payment request.
 */
export const createPaymentRequest = endpoint<
  CreatePaymentRequestRequestBody,
  BffPaymentRequest,
  string
>("POST", () => `/api/session/payment_requests`);

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
export const pollSession = endpoint<
  undefined,
  BffPollResponse,
  string,
  string | undefined
>(
  "GET",
  (sessionAuthKey) => `/api/session/${sessionAuthKey}/poll`,
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
>("GET", (sessionAuthKey) => `/api/sessions/${sessionAuthKey}/card_info`);
