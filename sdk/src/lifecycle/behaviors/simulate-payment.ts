import { simulatePaymentRequest } from "../../api";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SimulatePaymentBehavior implements Behavior {
  private simulationRequest: {
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  constructor(private bb: BlackboardType) {}

  enter() {
    this.simulatePayment();
  }

  exit() {
    this.abortSimulation();
  }

  abortSimulation() {
    if (this.simulationRequest) {
      this.simulationRequest.abortController.abort("Aborted");
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
    if (this.bb.world?.paymentEntity?.type !== "paymentRequest") {
      throw new Error("Payment entity is not a payment request");
    }

    const paymentRequestId = this.bb.world?.paymentEntity.id;
    const channelCode = this.bb.channel?.channel_code;

    if (this.bb.mock) {
      throw new Error("Simulate payment not supported for mock mode");
    }

    const abortController = new AbortController();
    const promise = simulatePaymentRequest(
      {
        channel_code: channelCode,
      },
      {
        sessionAuthKey: this.bb.sdkKey.sessionAuthKey,
        paymentRequestId: paymentRequestId,
      },
    )
      .then(() => {
        this.bb.actionCompleted = true;
        return undefined;
      })
      .finally(() => {
        this.simulationRequest = null;
        this.bb.simulatePaymentRequested = false;
        this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
      });

    this.simulationRequest = {
      promise,
      abortController,
    };
  }
}
