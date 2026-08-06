import {
  BffPaymentEntity,
  BffPaymentEntityType,
} from "../../../backend-types/payment-entity";
import { InternalUpdateWorldState } from "../../../private-event-types";
import {
  XenditPaymentRequestDiscardedEvent,
  XenditPaymentTokenDiscardedEvent,
} from "../../../public-event-types";
import { SessionTelemetry } from "../../../telemetry";
import { BlackboardType } from "../../behavior-tree";

export function discardPaymentEntity(
  paymentEntity: BffPaymentEntity,
  dispatchEvent: BlackboardType["dispatchEvent"],
  telemetry: SessionTelemetry,
) {
  switch (paymentEntity.type) {
    case BffPaymentEntityType.PaymentRequest:
      dispatchEvent(new XenditPaymentRequestDiscardedEvent(paymentEntity.id));
      break;
    case BffPaymentEntityType.PaymentToken:
      dispatchEvent(new XenditPaymentTokenDiscardedEvent(paymentEntity.id));
      break;
    default:
      paymentEntity satisfies never;
  }

  // telemetry for end of payment entity lifecycle
  telemetry.append({
    stage: "CHECKOUT_ATTEMPT_DISCARD",
    success: false,
  });

  dispatchEvent(
    new InternalUpdateWorldState({
      paymentEntity: null,
      sessionTokenRequestId: null,
    }),
  );
}
