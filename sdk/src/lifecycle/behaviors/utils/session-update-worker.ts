import { BffPollResponse } from "../../../backend-types/common";
import { BffPaymentEntity } from "../../../backend-types/payment-entity";
import { BlackboardType } from "../../behavior-tree";
import { PollWorker } from "./poll-worker";
import { StreamWorker } from "./stream-worker";

export type OnSessionUpdate = (
  result: BffPollResponse,
  paymentEntity: BffPaymentEntity | null,
) => void;

/**
 * Delivers session updates to a behavior until stop() is called.
 */
export interface SessionUpdateWorker {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

/**
 * Picks the stream when the stream-session experiment flag is true, except in
 * mock mode (nothing to stream) or right after a redirect return (the stream
 * sends nothing if the state didn't change, but the abandoned redirect check needs an answer).
 */
export function createSessionUpdateWorker(
  bb: BlackboardType,
  onResult: OnSessionUpdate,
): SessionUpdateWorker {
  const tokenRequestId = bb.world?.sessionTokenRequestId ?? null;
  const useStream =
    !bb.mock &&
    !bb.redirectReturnPending &&
    bb.world?.experiments?.["stream-session"] === true;

  return useStream
    ? new StreamWorker(bb.sdkKey, bb.sdk, tokenRequestId, onResult)
    : new PollWorker(bb.sdkKey, bb.sdk, tokenRequestId, onResult);
}
