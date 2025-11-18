import { simulatePaymentRequest } from "../../api";
import { BffPaymentEntityType } from "../../backend-types/payment-entity";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { AbortError, isAbortError } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SimulatePaymentBehavior implements Behavior {
  exited = false;

  private simulationRequest: {
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  constructor(private bb: BlackboardType) {}

  enter() {
    this.simulatePayment();
  }

  exit() {
    this.exited = true;
    this.bb.simulatePaymentRequested = false;
    this.abortSimulation();
  }

  abortSimulation() {
    if (this.simulationRequest) {
      this.simulationRequest.abortController.abort(new AbortError());
      this.simulationRequest = null;
    }
  }

  simulatePayment() {
    if (this.simulationRequest) {
      this.abortSimulation();
    }

    if (!this.bb.channel) {
      throw new Error("Channel is missing");
    }
    if (!this.bb.world?.paymentEntity) {
      throw new Error("Payment entity is missing");
    }
    if (
      this.bb.world?.paymentEntity?.type !== BffPaymentEntityType.PaymentRequest
    ) {
      throw new Error("Payment entity is not a payment request");
    }

    const paymentRequestId = this.bb.world?.paymentEntity.id;
    const channelCode = this.bb.channel?.channel_code;

    if (this.bb.mock) {
      throw new Error("Simulate payment not supported for mock mode");
    }

    const abortController = new AbortController();
    const promise = simulatePaymentRequest(
      this.bb.sdkKey,
      {
        channel_code: channelCode,
      },
      {
        sessionAuthKey: this.bb.sdkKey.sessionAuthKey,
        paymentRequestId: paymentRequestId,
      },
      undefined,
      abortController.signal,
    )
      .then(() => {
        // close the action while we wait for the payment entity to update
        this.bb.actionCompleted = true;
        this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
        return undefined;
      })
      .catch((error) => {
        if (isAbortError(error)) return;

        // ignore if we already exited
        if (!this.exited) {
          // exit the simulate payment state and log the error
          this.bb.simulatePaymentRequested = false;
          console.error("Simulate Payment failed:", error);
        }
      });

    this.simulationRequest = {
      promise,
      abortController,
    };
  }
}
