import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { assert } from "../../utils";
import {
  InternalScheduleMockUpdateEvent,
  InternalUpdateWorldState,
} from "../../private-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { PollWorker } from "./utils/poll-worker";
import { makeTestPollResponse } from "../../data/test-data-modifiers";

export class PaymentEntityPendingBehavior implements Behavior {
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
        case "PENDING":
          this.bb.dispatchEvent(
            new InternalScheduleMockUpdateEvent(
              makeTestPollResponse(this.bb.world, this.bb.channel, "SUCCESS"),
            ),
          );
          break;
        case "FAILED":
        case "CANCELED":
        case "EXPIRED":
          this.bb.dispatchEvent(
            new InternalScheduleMockUpdateEvent(
              makeTestPollResponse(this.bb.world, this.bb.channel, "FAILURE"),
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
