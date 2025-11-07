import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { Behavior, SdkData } from "../behavior-tree-runner";
import { PollWorker } from "./poll-worker";

export class PePendingBehavior implements Behavior {
  private pollWorker: PollWorker;
  constructor(
    private data: SdkData,
    private sessionTokenRequestId: string | null,
  ) {
    this.pollWorker = new PollWorker(
      this.data.sdkKey.sessionAuthKey,
      this.data.mock,
      this.sessionTokenRequestId,
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
    this.data.sdkEvents.updateWorld({
      session: pollResponse.session,
      paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns undefined/null
      succeededChannel: pollResponse.succeeded_channel ?? null, // do set succeeded channel to null if it doesn't return one
    });
  };
}

export class PeRequiresActionBehavior implements Behavior {
  private pollWorker: PollWorker;
  constructor(
    private data: SdkData,
    private sessionTokenRequestId: string | null,
  ) {
    this.pollWorker = new PollWorker(
      this.data.sdkKey.sessionAuthKey,
      this.data.mock,
      this.sessionTokenRequestId,
      this.onPollResult,
    );
  }

  enter() {
    this.data.sdkEvents.setHasAction(true);
    this.pollWorker.start();
  }

  exit() {
    this.pollWorker.stop();
    this.data.sdkEvents.setHasAction(false);
  }

  onPollResult = (
    pollResponse: BffPollResponse,
    paymentEntity: BffPaymentEntity | null,
  ) => {
    this.data.sdkEvents.updateWorld({
      session: pollResponse.session,
      paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns undefined/null
      succeededChannel: pollResponse.succeeded_channel ?? null, // do set succeeded channel to null if it doesn't return one
    });
  };
}

export class PeFailedBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    // TODO: emit payment attempt failed event
  }
}
