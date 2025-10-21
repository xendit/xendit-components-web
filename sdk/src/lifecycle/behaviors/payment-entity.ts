import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { Behavior, SdkData } from "../behavior-tree-runner";

export class PePendingBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private paymentEntity: BffPaymentEntity,
  ) {}

  enter() {
    // TODO: start polling
  }

  exit() {
    // TODO: stop polling
  }
}

export class PeRequiresActionBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private paymentEntity: BffPaymentEntity,
  ) {}

  enter() {
    // TODO: start polling
  }

  exit() {
    // TODO: stop polling
  }
}

export class PeFailedBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private paymentEntity: BffPaymentEntity,
  ) {}

  enter() {
    // TODO: emit payment attempt failed event
  }
}
