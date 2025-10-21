import { BffAction, BffPaymentEntity } from "../backend-types/payment-entity";
import { BffSession } from "../backend-types/session";
import { pickAction } from "../utils";
import { behaviorNode } from "./behavior-tree-runner";
import { ActionRedirectBehavior } from "./behaviors/action";
import {
  PeFailedBehavior,
  PePendingBehavior,
  PeRequiresActionBehavior,
} from "./behaviors/payment-entity";
import {
  SdkActiveBehavior,
  SdkFatalErrorBehavior,
  SdkLoadingBehavior,
} from "./behaviors/sdk";
import {
  SessionActiveBehavior,
  SessionCompletedBehavior,
  SessionFailedBehavior,
} from "./behaviors/session";

type SdkStatus = "ACTIVE" | "LOADING" | "FATAL_ERROR";

export function behaviorTreeForSdk(
  sdkStatus: SdkStatus,
  session: BffSession | null,
  paymentEntity: BffPaymentEntity | null,
) {
  switch (sdkStatus) {
    case "LOADING": {
      return behaviorNode(SdkLoadingBehavior, []);
    }
    case "ACTIVE": {
      if (!session) {
        throw new Error("Session is required when SDK is active");
      }
      return behaviorNode(
        SdkActiveBehavior,
        [],
        behaviorTreeForSession(session, paymentEntity),
      );
    }
    case "FATAL_ERROR": {
      return behaviorNode(SdkFatalErrorBehavior, []);
    }
    default: {
      sdkStatus satisfies never;
      throw new Error(`Unknown SDK status: ${sdkStatus as SdkStatus}`);
    }
  }
}

export function behaviorTreeForSession(
  session: BffSession,
  paymentEntity: BffPaymentEntity | null,
) {
  switch (session.status) {
    case "ACTIVE": {
      return behaviorNode(
        SessionActiveBehavior,
        [session, paymentEntity],
        paymentEntity ? behaviorTreeForPaymentEntity(paymentEntity) : undefined,
      );
    }
    case "COMPLETED": {
      return behaviorNode(SessionCompletedBehavior, []);
    }
    case "EXPIRED": {
      return behaviorNode(SessionFailedBehavior, [session.status]);
    }
    case "CANCELED": {
      return behaviorNode(SessionFailedBehavior, [session.status]);
    }
    default: {
      session.status satisfies never;
      throw new Error(
        `Unknown session status: ${(session as BffSession).status}`,
      );
    }
  }
}

export function behaviorTreeForPaymentEntity(paymentEntity: BffPaymentEntity) {
  switch (paymentEntity.entity.status) {
    case "PENDING": {
      return behaviorNode(PePendingBehavior, [paymentEntity]);
    }
    case "REQUIRES_ACTION": {
      return behaviorNode(
        PeRequiresActionBehavior,
        [paymentEntity],
        behaviorTreeForAction(pickAction(paymentEntity.entity.actions)),
      );
    }
    case "FAILED":
    case "EXPIRED":
    case "CANCELED": {
      return behaviorNode(PeFailedBehavior, [paymentEntity]);
    }
    case "ACCEPTING_PAYMENTS": {
      // Never happens because sessions don't set the PR type to REUSABLE_PAYMENT_CODE
      throw new Error("Status ACCEPTING_PAYMENTS should not happen");
    }
    case "AUTHORIZED": {
      // Never happens because only CARDS_SESSIONS_JS sessions can use manual capture
      throw new Error("Status AUTHORIZED should not happen");
    }
    case "ACTIVE":
    case "SUCCEEDED": {
      // The payemnt entity is completed but the session is still active, it should automatically switch to completed soon
      return behaviorNode(PePendingBehavior, [paymentEntity]);
    }
    default: {
      paymentEntity.entity satisfies never;
      throw new Error(
        `Unknown payment entity status: ${(paymentEntity as BffPaymentEntity).entity.status}`,
      );
    }
  }
}

export function behaviorTreeForAction(action: BffAction) {
  switch (action.type) {
    case "REDIRECT_CUSTOMER": {
      switch (action.descriptor) {
        case "WEB_URL": {
          return behaviorNode(ActionRedirectBehavior, [action]);
        }
        case "DEEPLINK_URL": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
      }
      break;
    }
    case "PRESENT_TO_CUSTOMER": {
      switch (action.descriptor) {
        case "QR_STRING": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
        case "PAYMENT_CODE": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
        case "VIRTUAL_ACCOUNT_NUMBER": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
      }
      break;
    }
    case "API_POST_REQUEST": {
      switch (action.descriptor) {
        case "CAPTURE_PAYMENT": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
        case "VALIDATE_OTP": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
        case "RESEND_OTP": {
          throw new Error(`Unsupported action type ${action.type}`);
        }
      }
      break;
    }
  }
  action satisfies never;
  throw new Error(`Unknown action type: ${(action as BffAction).type}`);
}
