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
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
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

    this.bb.dispatchEvent(
      new XenditSubmissionEndEvent("TEMP", [""], {
        type: "ERROR",
        code: "",
      }),
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
