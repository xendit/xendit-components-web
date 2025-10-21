import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { BffSession, BffSessionStatus } from "../../backend-types/session";
import { Behavior, SdkData } from "../behavior-tree-runner";

export class SessionActiveBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private session: BffSession,
    private paymentEntity: BffPaymentEntity | null,
  ) {}

  enter() {
    // TODO: emit ready or not-ready events based on form state and whether we have a payment entity
  }

  submit() {
    // TODO: send submit api call and set paymentEntity in sdk data
  }

  exit() {
    // TODO: cancel any in-flight requests
  }
}

export class SessionCompletedBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    this.data.sdkEvents.setSessionState("COMPLETED");
  }
}

export class SessionFailedBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private sessionStatus: BffSessionStatus,
  ) {}

  enter() {
    this.data.sdkEvents.setSessionState(this.sessionStatus);
  }
}
