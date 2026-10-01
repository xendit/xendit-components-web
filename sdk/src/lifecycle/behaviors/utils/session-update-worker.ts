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
 * Reason StreamWorker switched to polling.
 */
export type StreamFallbackReason =
  | "invalid_message" // an update or final message had invalid JSON
  | "server_error" // the server sent an error event other than timeout
  | "stream_refused" // EventSource gave up, e.g. an error response or a wrong content type
  | "too_many_drops" // the connection dropped MAX_DROPS times in a row
  | "no_heartbeat"; // the watchdog fired before any heartbeat

export type SessionUpdateSummary = {
  mode: "poll" | "stream" | "stream_fallback_poll"; // how the latest worker got session updates
  fallbackReason?: StreamFallbackReason; // the fallback's reason
};

/**
 * Always picks the stream in mock mode.
 * Otherwise picks it when the stream-session experiment flag is true, except right after a redirect return (the stream sends nothing if the state didn't change, but the abandoned redirect check needs an answer).
 */
export function createSessionUpdateWorker(
  bb: BlackboardType,
  onResult: OnSessionUpdate,
): SessionUpdateWorker {
  const tokenRequestId = bb.world?.sessionTokenRequestId ?? null;
  const useStream =
    bb.mock ||
    (!bb.redirectReturnPending &&
      bb.world?.experiments?.["stream-session"] === true);
  bb.sessionUpdateSummary = { mode: useStream ? "stream" : "poll" };

  return useStream
    ? new StreamWorker(
        bb.sdkKey,
        bb.sdk,
        tokenRequestId,
        onResult,
        (reason) => {
          bb.sessionUpdateSummary = {
            mode: "stream_fallback_poll",
            fallbackReason: reason,
          };
        },
      )
    : new PollWorker(bb.sdkKey, tokenRequestId, onResult);
}
