import { simulatePaymentRequest } from "../../api";
import { BffChannel } from "../../backend-types/channel";
import { BffPaymentEntityType } from "../../backend-types/payment-entity";
import {
  makeTestPaymentRequest,
  makeTestPollResponse,
} from "../../data/test-data-modifiers";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalScheduleMockUpdateEvent,
} from "../../private-event-types";
import {
  AbortError,
  cancellableSleep,
  isAbortError,
  MOCK_NETWORK_DELAY_MS,
  ParsedSdkKey,
} from "../../utils";
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
    this.bb.prefersRedirectAction = false;
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
    if (!this.bb.world) {
      throw new Error("Invalid state");
    }
    if (!this.bb.world.paymentEntity) {
      throw new Error("Payment entity is missing");
    }
    if (
      this.bb.world.paymentEntity.type !== BffPaymentEntityType.PaymentRequest
    ) {
      throw new Error("Payment entity is not a payment request");
    }

    const paymentRequestId = this.bb.world?.paymentEntity.id;

    const abortController = new AbortController();
    const promise = simulatePaymentAsync(
      this.bb.sdkKey,
      this.bb.mock,
      this.bb.channel,
      paymentRequestId,
      abortController.signal,
    )
      .then(() => {
        if (this.bb.mock && this.bb.world) {
          // in mock mode, trigger transition to success state
          this.bb.dispatchEvent(
            new InternalScheduleMockUpdateEvent(
              makeTestPollResponse(this.bb.world, this.bb.channel, "SUCCESS"),
            ),
          );
        }

        this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
      })
      .catch((error) => {
        if (isAbortError(error)) return;

        if (this.exited) return;

        if (
          error.errorResponse?.error_code === "PAYMENT_METHOD_NOT_SUPPORTED" &&
          this.tryFallBackToRedirect()
        ) {
          // we deferred to ActionRedirectBehavior, which will navigate away;
          // don't treat this as a failure
          return;
        }

        this.bb.simulatePaymentRequested = false;
        console.error("Simulate Payment failed:", error);
      });

    this.simulationRequest = {
      promise,
      abortController,
    };
  }

  /**
   * When simulate payment returns PAYMENT_METHOD_NOT_SUPPORTED, some channels
   * (like ShopeePay) still expose a redirect action to complete the payment. If a
   * redirect action is present on the current payment entity, set the blackboard
   * to prefer that action and dispatch an update event to trigger the transition
   * to ActionRedirectBehavior.
   *
   * Returns true if the fallback was triggered.
   */
  private tryFallBackToRedirect(): boolean {
    const actions = this.bb.world?.paymentEntity?.entity.actions;
    if (!actions) return false;

    const redirectAction = actions.find(
      (action) => action.type === "REDIRECT_CUSTOMER",
    );
    if (!redirectAction) return false;

    // simulate payment is no longer relevant, we're redirecting away
    this.bb.simulatePaymentRequested = false;

    // defer to ActionRedirectBehavior
    this.bb.prefersRedirectAction = true;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());

    return true;
  }
}

async function simulatePaymentAsync(
  sdkKey: ParsedSdkKey,
  mock: boolean,
  channel: BffChannel,
  paymentRequestId: string,
  abortSignal: AbortSignal,
) {
  if (mock) {
    await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortSignal);
    return makeTestPaymentRequest(
      channel.channel_code,
      channel._mock_action_type,
    );
  } else {
    return await simulatePaymentRequest(
      sdkKey,
      {
        channel_code: channel.channel_code,
      },
      {
        sessionAuthKey: sdkKey.sessionAuthKey,
        paymentRequestId: paymentRequestId,
      },
      undefined,
      abortSignal,
    );
  }
}
