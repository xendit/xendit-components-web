import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { Behavior, SdkData } from "../behavior-tree-runner";
import { PollWorker } from "./poll-worker";

export class PePendingBehavior implements Behavior {
  private pollWorker: PollWorker;
  constructor(
    private data: SdkData,
    private paymentEntity: BffPaymentEntity,
  ) {
    this.pollWorker = new PollWorker(
      this.data.sdkKey.sessionAuthKey,
      // TODO: session_token_request_id should be stored separately because it doesn't get returned on polls, only the first request
      this.paymentEntity.entity.session_token_request_id,
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
    console.log(pollResponse, paymentEntity);
  };
}

export class PeRequiresActionBehavior implements Behavior {
  private pollWorker: PollWorker;
  constructor(
    private data: SdkData,
    private paymentEntity: BffPaymentEntity,
  ) {
    this.pollWorker = new PollWorker(
      this.data.sdkKey.sessionAuthKey,
      this.paymentEntity.entity.session_token_request_id,
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
    console.log(pollResponse, paymentEntity);
  };
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
