import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import {
  InternalNeedsRerenderEvent,
  InternalUpdateWorldState,
} from "../../private-event-types";
import {
  XenditSessionCompleteEvent,
  XenditSessionExpiredOrCanceledEvent,
  XenditSessionNotPendingEvent,
  XenditSessionPendingEvent,
} from "../../public-event-types";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { discardPaymentEntity } from "./discard";
import { PollWorker } from "./poll-worker";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    // Schedule rerender (components don't render anything if the session state is not active)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  exit() {
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }
}

export class SessionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditSessionCompleteEvent());
  }
}

export class SessionFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditSessionExpiredOrCanceledEvent());
  }
}

export class SessionPendingBehavior implements Behavior {
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
    this.pollWorker.start();

    this.bb.dispatchEvent(new XenditSessionPendingEvent());
  }

  exit() {
    this.pollWorker.stop();

    assert(this.bb.world?.session);

    // discard payment entity unless session is transitioning to COMPLETE
    const paymentEntity = this.bb.world.paymentEntity;
    if (this.bb.world.session.status !== "COMPLETED" && paymentEntity) {
      discardPaymentEntity(paymentEntity, this.bb.dispatchEvent);
    }

    this.bb.dispatchEvent(new XenditSessionNotPendingEvent());
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
