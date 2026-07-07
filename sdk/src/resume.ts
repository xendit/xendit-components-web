import { BffPollResponse } from "./backend-types/common";
import {
  BffPaymentEntity,
  BffPaymentEntityType,
  toPaymentEntity,
} from "./backend-types/payment-entity";

/**
 * Given a poll response for a specific token_request_id, decide whether the SDK
 * should resume. Returns the world-state fragment to apply if a payment entity
 * was found, otherwise null (no entity = nothing to resume).
 *
 * If the poll still says REQUIRES_ACTION, the backend hasn't settled yet, so we
 * map the redirect hint (component_status) to a final status:
 *   FAILED  -> FAILED
 *   SUCCESS -> SUCCEEDED (payment request) / ACTIVE (payment token)
 * Any already-settled status, or a missing hint, is left unchanged.
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

  if (paymentEntity.entity.status === "REQUIRES_ACTION") {
    if (componentStatus === "FAILED") {
      paymentEntity.entity.status = "FAILED";
    } else if (componentStatus === "SUCCESS") {
      paymentEntity.entity.status =
        paymentEntity.type === BffPaymentEntityType.PaymentRequest
          ? "SUCCEEDED"
          : "ACTIVE";
    }
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
