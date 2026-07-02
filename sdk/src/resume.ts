import { BffPollResponse } from "./backend-types/common";
import {
  BffPaymentEntity,
  toPaymentEntity,
} from "./backend-types/payment-entity";

/**
 * Given a poll response for a specific token_request_id, decide whether the SDK
 * should resume. Returns the world-state fragment to apply if a payment entity
 * was found, otherwise null (no entity = nothing to resume).
 *
 * Some channels (e.g. GOPAY) don't update the payment status when the user
 * cancels on the partner page — the status stays REQUIRES_ACTION. In that case
 * we can't rely on the status alone, so we trust the redirect hint: when
 * componentStatus is "FAILED", treat a still-REQUIRES_ACTION entity as CANCELED
 * so the tree routes to the error state instead of re-showing the action.
 */
export function resolveResumeState(
  pollResult: BffPollResponse,
  resumeTokenRequestId: string,
  componentStatus: string | null,
): { paymentEntity: BffPaymentEntity; sessionTokenRequestId: string } | null {
  const entityRaw = pollResult.payment_request ?? pollResult.payment_token;
  if (!entityRaw) {
    return null;
  }

  const paymentEntity = toPaymentEntity(entityRaw);

  if (
    paymentEntity.entity.status === "REQUIRES_ACTION" &&
    componentStatus === "FAILED"
  ) {
    paymentEntity.entity.status = "CANCELED";
  }

  return {
    paymentEntity,
    sessionTokenRequestId: resumeTokenRequestId,
  };
}

/**
 * Reads the resume hints Xendit appends to the merchant return_url after a
 * redirect payment: token_request_id (which attempt to poll) and
 * component_status (the redirect outcome hint). Pass window.location.search.
 */
export function getResumeParams(search: string): {
  tokenRequestId: string | null;
  componentStatus: string | null;
} {
  const params = new URLSearchParams(search);
  return {
    tokenRequestId: params.get("token_request_id"),
    componentStatus: params.get("component_status"),
  };
}
