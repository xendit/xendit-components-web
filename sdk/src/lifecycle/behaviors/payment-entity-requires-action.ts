import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { InternalUpdateWorldState } from "../../private-event-types";
import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
} from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { PollWorker } from "./utils/poll-worker";

export class PaymentEntityRequiresActionBehavior implements Behavior {
  private pollWorker: PollWorker | null = null;
  public canCreateActionContainer: boolean = true;

  constructor(private bb: BlackboardType) {
    this.resetPolling();
  }

  enter() {
    this.bb.dispatchEvent(new XenditActionBeginEvent());
    this.canCreateActionContainer = false;
    this.pollWorker?.start();
  }

  updatePostorder() {
    if (this.bb.pollImmediatelyRequested) {
      this.bb.pollImmediatelyRequested = false;
      this.resetPolling();
    }
  }

  exit() {
    this.pollWorker?.stop();
    this.bb.dispatchEvent(new XenditActionEndEvent());

    // clear flag for next time
    this.bb.actionCompleted = false;
    this.bb.redirectReturnPending = false;
  }

  onPollResult = (
    pollResponse: BffPollResponse,
    paymentEntity: BffPaymentEntity | null,
  ) => {
    // If the buyer just returned from a redirect and the poll status is REQUIRES_ACTION, assume they abandoned it and cancel instead of waiting forever.
    if (paymentEntity) {
      const abandonedAfterRedirect =
        this.bb.redirectReturnPending &&
        paymentEntity.entity.status === "REQUIRES_ACTION";
      this.bb.redirectReturnPending = false;

      if (abandonedAfterRedirect) {
        this.bb.submissionRequested = false;
        this.bb.resuming = false;
      }
    }

    this.bb.dispatchEvent(
      new InternalUpdateWorldState({
        session: pollResponse.session,
        paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns undefined/null
        succeededChannel: pollResponse.succeeded_channel ?? null, // do set succeeded channel to null if it doesn't return one
      }),
    );
  };

  /**
   * Stop the current poll worker and make a new one. Start polling if the previous pollWorker was polling.
   */
  resetPolling() {
    const polling = this.pollWorker?.isPolling() ?? false;
    this.pollWorker?.stop();
    this.pollWorker = new PollWorker(
      this.bb.sdkKey,
      this.bb.sdk,
      this.bb.world?.sessionTokenRequestId ?? null,
      this.onPollResult,
    );
    if (polling) {
      this.pollWorker.start();
    }
  }
}
