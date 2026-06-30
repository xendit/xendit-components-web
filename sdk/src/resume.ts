import { BffPollResponse } from "./backend-types/common";
import {
  BffPaymentEntity,
  toPaymentEntity,
} from "./backend-types/payment-entity";

/**
 * Statuses that mean the previous payment attempt is finished and failed.
 * Only these are worth resuming into the error chain — a still-active session
 * keeps these on the payment entity while remaining ACTIVE.
 */
const TERMINAL_FAILURE_STATUSES: BffPaymentEntity["entity"]["status"][] = [
  "FAILED",
  "EXPIRED",
  "CANCELED",
];

/**
 * Given a poll response for a specific token_request_id, decide whether the SDK
 * should resume into the error state. Returns the world-state fragment to apply
 * if the polled entity failed, otherwise null.
 */
export function resolveResumeState(
  pollResult: BffPollResponse,
  resumeTokenRequestId: string,
): { paymentEntity: BffPaymentEntity; sessionTokenRequestId: string } | null {
  const entityRaw = pollResult.payment_request ?? pollResult.payment_token;
  if (!entityRaw) {
    return null;
  }

  const paymentEntity = toPaymentEntity(entityRaw);
  const status = paymentEntity.entity.status;

  if (!TERMINAL_FAILURE_STATUSES.includes(status)) {
    return null;
  }

  return {
    paymentEntity,
    sessionTokenRequestId: resumeTokenRequestId,
  };
}

/**
 * Reads the token_request_id that Xendit appends to the merchant return_url
 * after a redirect payment. Returns null when absent. Pass window.location.search.
 */
export function getResumeTokenRequestId(search: string): string | null {
  return new URLSearchParams(search).get("token_request_id");
}
