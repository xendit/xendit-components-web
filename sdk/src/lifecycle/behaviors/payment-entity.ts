import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { PollWorker } from "./poll-worker";

export class PePendingBehavior implements Behavior {
  private pollWorker: PollWorker;
  constructor(private bb: BlackboardType) {
    this.pollWorker = new PollWorker(
      this.bb.sdkKey,
      this.bb.sdkEvents.sdk,
      this.bb.world?.sessionTokenRequestId ?? null,
      this.onPollResult,
    );
  }

  enter() {
    this.pollWorker.start();
  }

  exit() {
    this.pollWorker.stop();
  }

  onPollResult = (
    pollResponse: BffPollResponse,
    paymentEntity: BffPaymentEntity | null,
  ) => {
    this.bb.sdkEvents.updateWorld({
      session: pollResponse.session,
      paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns undefined/null
      succeededChannel: pollResponse.succeeded_channel ?? null, // do set succeeded channel to null if it doesn't return one
    });
  };
}

export class PeRequiresActionBehavior implements Behavior {
  private pollWorker: PollWorker | null = null;
  public canCreateActionContainer: boolean = true;

  constructor(private bb: BlackboardType) {
    this.resetPolling();
  }

  enter() {
    this.bb.sdkEvents.setHasAction(true);
    this.canCreateActionContainer = false;
    this.pollWorker?.start();
  }

  update() {
    if (this.bb.pollImmediatelyRequested) {
      this.bb.pollImmediatelyRequested = false;
      this.resetPolling();
    }
  }

  exit() {
    this.pollWorker?.stop();
    this.bb.sdkEvents.setHasAction(false);

    // clear flag for next time
    this.bb.actionCompleted = false;
  }

  onPollResult = (
    pollResponse: BffPollResponse,
    paymentEntity: BffPaymentEntity | null,
  ) => {
    this.bb.sdkEvents.updateWorld({
      session: pollResponse.session,
      paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns undefined/null
      succeededChannel: pollResponse.succeeded_channel ?? null, // do set succeeded channel to null if it doesn't return one
    });
  };

  /**
   * Stop the current poll worker and make a new one. Start polling if the previous pollWorker was polling.
   */
  resetPolling() {
    const polling = this.pollWorker?.isPolling() ?? false;
    this.pollWorker?.stop();
    this.pollWorker = new PollWorker(
      this.bb.sdkKey,
      this.bb.sdkEvents.sdk,
      this.bb.world?.sessionTokenRequestId ?? null,
      this.onPollResult,
    );
    if (polling) {
      this.pollWorker.start();
    }
  }
}

export class PeFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.submissionRequested = false;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }
}
