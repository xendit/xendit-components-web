import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { assert } from "../../utils";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalScheduleMockUpdateEvent,
  InternalUpdateWorldState,
} from "../../private-event-types";
import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
} from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { PollWorker } from "./poll-worker";
import {
  makeTestPollResponseForFailure,
  makeTestPollResponseForSuccess,
} from "../../test-data";

export class PePendingBehavior implements Behavior {
  private pollWorker: PollWorker;
  constructor(private bb: BlackboardType) {
    this.pollWorker = new PollWorker(
      this.bb.sdkKey,
      this.bb.sdk,
      this.bb.world?.sessionTokenRequestId ?? null,
      this.onPollResult,
    );
  }

  enter() {
    if (this.bb.mock) {
      // if we get to pending state in mock mode, we need to schedule a mock update or nothing will happen.
      // usually, the payment entity will have a success/fail status and we need to also update the session status.
      assert(this.bb.world?.paymentEntity);
      switch (this.bb.world?.paymentEntity.entity.status) {
        case "ACTIVE":
        case "AUTHORIZED":
        case "SUCCEEDED":
          this.bb.dispatchEvent(
            new InternalScheduleMockUpdateEvent(
              makeTestPollResponseForSuccess(
                this.bb.world.session,
                this.bb.world.paymentEntity,
              ),
            ),
          );
          break;
        case "FAILED":
        case "CANCELED":
        case "EXPIRED":
          this.bb.dispatchEvent(
            new InternalScheduleMockUpdateEvent(
              makeTestPollResponseForFailure(
                this.bb.world.session,
                this.bb.world.paymentEntity,
              ),
            ),
          );
          break;
        default:
        // should never happen, just stay in pending state forever :(
      }
    }

    this.pollWorker.start();
  }

  exit() {
    this.pollWorker.stop();
  }

  onPollResult = (
    pollResponse: BffPollResponse,
    paymentEntity: BffPaymentEntity | null,
  ) => {
    this.bb.dispatchEvent(
      new InternalUpdateWorldState({
        session: pollResponse.session,
        paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns undefined/null
        succeededChannel: pollResponse.succeeded_channel ?? null, // do set succeeded channel to null if it doesn't return one
      }),
    );
  };
}

export class PeRequiresActionBehavior implements Behavior {
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

  update() {
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
  }

  onPollResult = (
    pollResponse: BffPollResponse,
    paymentEntity: BffPaymentEntity | null,
  ) => {
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

export class PeFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.submissionRequested = false;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }
}
