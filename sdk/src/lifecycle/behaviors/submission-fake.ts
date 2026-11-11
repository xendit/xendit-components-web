import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import {
  InternalNeedsRerenderEvent,
  InternalUpdateWorldState,
} from "../../private-event-types";
import {
  XenditSubmissionBeginEvent,
  XenditSubmissionEndEvent,
} from "../../public-event-types";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { inferSubmissionEndReason } from "./digital-wallet-probe-googlepay";
import {
  createSessionUpdateWorker,
  SessionUpdateWorker,
} from "./utils/session-update-worker";

export class SubmissionFakeBehavior implements Behavior {
  private updateWorker: SessionUpdateWorker;

  constructor(private bb: BlackboardType) {
    this.updateWorker = createSessionUpdateWorker(this.bb, this.onPollResult);
  }

  enter() {
    this.bb.dispatchEvent(new XenditSubmissionBeginEvent());

    // start listening for changes
    this.updateWorker.start();
  }

  exit() {
    this.updateWorker.stop();

    assert(this.bb.world);

    const inferredEndReason = inferSubmissionEndReason(
      this.bb.world.session,
      this.bb.world.paymentEntity,
      null,
      this.bb.sdk.t,
    );
    let reason = inferredEndReason.reason;
    const { userErrorMessage, developerErrorMessage } = inferredEndReason;
    if (reason) {
      // ok, we got a reason from the infer function
    } else {
      // the only reason left is that the user bailed out
      reason = "ACTION_ABORTED";
    }

    this.bb.dispatchEvent(
      new XenditSubmissionEndEvent(
        reason,
        userErrorMessage,
        developerErrorMessage,
      ),
    );
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
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
