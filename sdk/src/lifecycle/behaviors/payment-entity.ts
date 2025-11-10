import { simulatePaymentRequest } from "../../api";
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
  private pollWorker: PollWorker | null = null;
  public canCreateActionContainer: boolean = true;

  private simulationRequest: {
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  constructor(
    private data: SdkData,
    private sessionTokenRequestId: string | null,
  ) {
    this.resetPolling();
  }

  enter() {
    this.data.sdkEvents.setHasAction(true);
    this.canCreateActionContainer = false;
    this.pollWorker?.start();
  }

  exit() {
    this.abortSimulation();
    this.pollWorker?.stop();
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

  /**
   * Stop the current poll worker and make a new one. Start polling if the previous pollWorker was polling.
   */
  resetPolling() {
    const polling = this.pollWorker?.isPolling() ?? false;
    this.pollWorker?.stop();
    this.pollWorker = new PollWorker(
      this.data.sdkKey.sessionAuthKey,
      this.data.mock,
      this.sessionTokenRequestId,
      this.onPollResult,
    );
    if (polling) {
      this.pollWorker.start();
    }
  }

  abortSimulation() {
    if (this.simulationRequest) {
      this.simulationRequest.abortController.abort();
      this.simulationRequest = null;
    }
  }

  simulatePayment(paymentRequestId: string, channelCode: string) {
    if (this.simulationRequest) {
      this.abortSimulation();
    }

    if (this.data.mock) {
      // TODO: implement simulate payment for mocks
      return;
    }

    const abortController = new AbortController();
    const promise = simulatePaymentRequest(
      {
        channel_code: channelCode,
      },
      {
        sessionAuthKey: this.data.sdkKey.sessionAuthKey,
        paymentRequestId: paymentRequestId,
      },
    )
      .then(() => {
        this.resetPolling();
      })
      .finally(() => {
        this.simulationRequest = null;
      });

    this.simulationRequest = {
      promise,
      abortController,
    };
  }
}

export class PeFailedBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    // TODO: emit payment attempt failed event
  }
}
