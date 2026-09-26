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
 * Always picks the stream in mock mode.
 * Otherwise picks it when the stream-session experiment flag is true, except right after a redirect return (the stream sends nothing if the state didn't change, but the abandoned redirect check needs an answer).
 * onHeartbeat is only called by the stream; a PollWorker reports every answer through onResult.
 */
export function createSessionUpdateWorker(
  bb: BlackboardType,
  onResult: OnSessionUpdate,
  onHeartbeat: () => void = () => {},
): SessionUpdateWorker {
  const tokenRequestId = bb.world?.sessionTokenRequestId ?? null;
  const useStream =
    bb.mock ||
    (!bb.redirectReturnPending &&
      bb.world?.experiments?.["stream-session"] === true);

  return useStream
    ? new StreamWorker(bb.sdkKey, bb.sdk, tokenRequestId, onResult, onHeartbeat)
    : new PollWorker(bb.sdkKey, tokenRequestId, onResult);
}
