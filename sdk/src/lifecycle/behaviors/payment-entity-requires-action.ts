import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { InternalUpdateWorldState } from "../../private-event-types";
import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
} from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import {
  createSessionUpdateWorker,
  SessionUpdateWorker,
} from "./utils/session-update-worker";

export class PaymentEntityRequiresActionBehavior implements Behavior {
  private updateWorker: SessionUpdateWorker | null = null;
  public canCreateActionContainer: boolean = true;

  constructor(private bb: BlackboardType) {
    this.resetWorker();
  }

  enter() {
    this.bb.dispatchEvent(new XenditActionBeginEvent());
    this.canCreateActionContainer = false;
    this.updateWorker?.start();
  }

  updatePostorder() {
    if (this.bb.pollImmediatelyRequested) {
      this.bb.pollImmediatelyRequested = false;
      this.resetWorker();
    }
  }

  exit() {
    this.updateWorker?.stop();
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
   * Stop the current worker and make a new one. Start it if the previous worker was running.
   */
  resetWorker() {
    const running = this.updateWorker?.isRunning() ?? false;
    this.updateWorker?.stop();
    this.updateWorker = createSessionUpdateWorker(this.bb, this.onPollResult);
    if (running) {
      this.updateWorker.start();
    }
  }
}
