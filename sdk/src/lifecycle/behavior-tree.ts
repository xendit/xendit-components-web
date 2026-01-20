import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { BffAction, BffPaymentEntity } from "../backend-types/payment-entity";
import { BffSession } from "../backend-types/session";
import { WorldState, XenditComponents } from "../public-sdk";
import {
  findBestAction,
  ParsedSdkKey,
  redirectCanBeHandledInIframe,
} from "../utils";
import { channelPropertiesAreValid } from "../validation";
import { behaviorNode } from "./behavior-tree-runner";
import {
  ActionCompletedBehavior,
  ActionIframeBehavior,
  ActionRedirectBehavior,
} from "./behaviors/action";
import { CardInfoBehavior } from "./behaviors/card-info";
import {
  ChannelInvalidBehavior,
  ChannelValidBehavior,
} from "./behaviors/channel";
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
import { SimulatePaymentBehavior } from "./behaviors/simulate-payment";
import { SubmissionBehavior } from "./behaviors/submission";

export type SdkStatus = "ACTIVE" | "LOADING" | "FATAL_ERROR";

/**
 * "Blackboard" means mutable state available to the behavior tree and all behavior instances.
 */
export type BlackboardType = {
  readonly sdk: XenditComponents;
  readonly mock: boolean;
  readonly sdkKey: ParsedSdkKey;

  // backend state
  world: WorldState | null;

  // current UI state
  sdkStatus: SdkStatus;
  sdkFatalErrorMessage: string | null;
  channel: BffChannel | null;
  channelProperties: ChannelProperties | null;
  savePaymentMethod: boolean | null;

  // dispatch event on the SDK instance
  dispatchEvent(event: Event): boolean;

  // flags
  // if true, start a submission, if false abort submission
  submissionRequested: boolean;
  // if true, start simulate payment, if false abort simulate payment
  simulatePaymentRequested: boolean;
  // if true, do not show the current action UI
  actionCompleted: boolean;
  // if true, poll the payment entity immediately on the next update
  pollImmediatelyRequested: boolean;
};

export function behaviorTreeForSdk(bb: BlackboardType) {
  switch (bb.sdkStatus) {
    case "LOADING": {
      return behaviorNode(SdkLoadingBehavior);
    }
    case "ACTIVE": {
      if (!bb.world?.session) {
        throw new Error("Session is required when SDK is active");
      }
      return behaviorNode(
        SdkActiveBehavior,
        "active",
        behaviorTreeForSession(bb),
      );
    }
    case "FATAL_ERROR": {
      return behaviorNode(SdkFatalErrorBehavior);
    }
    default: {
      bb.sdkStatus satisfies never;
      throw new Error(`Unknown SDK status: ${bb.sdkStatus as SdkStatus}`);
    }
  }
}

export function behaviorTreeForSession(bb: BlackboardType) {
  if (!bb.world?.session) {
    throw new Error("Session is required to create behavior tree for session");
  }
  switch (bb.world.session.status) {
    case "ACTIVE": {
      return behaviorNode(
        SessionActiveBehavior,
        "active",
        bb.submissionRequested
          ? behaviorTreeForSubmission(bb)
          : behaviorTreeForForm(bb),
      );
    }
    case "COMPLETED": {
      return behaviorNode(SessionCompletedBehavior);
    }
    case "EXPIRED": {
      return behaviorNode(SessionFailedBehavior, bb.world.session.status);
    }
    case "CANCELED": {
      return behaviorNode(SessionFailedBehavior, bb.world.session.status);
    }
    default: {
      bb.world.session.status satisfies never;
      throw new Error(
        `Unknown session status: ${(bb.world.session as BffSession).status}`,
      );
    }
  }
}

export function behaviorTreeForForm(bb: BlackboardType) {
  if (!bb.channel || !bb.world?.session) {
    return undefined;
  }

  const billingInformationRequired =
    bb.world.cardDetails.details?.require_billing_information ?? false;

  const channelPropertiesValid = channelPropertiesAreValid(
    bb.world.session.session_type,
    bb.channel,
    bb.channelProperties ?? null,
    billingInformationRequired,
  );

  const formValidityBehavior = channelPropertiesValid
    ? behaviorNode(ChannelValidBehavior)
    : behaviorNode(ChannelInvalidBehavior);

  if (bb.channel.channel_code === "CARDS") {
    return behaviorNode(CardInfoBehavior, "card-info", formValidityBehavior);
  } else {
    return formValidityBehavior;
  }
}

export function behaviorTreeForSubmission(bb: BlackboardType) {
  if (!bb.world) {
    throw new Error("SDK not initialized in behaviorTreeForSubmission");
  }

  return behaviorNode(
    SubmissionBehavior,
    "submission",
    bb.world.paymentEntity && bb.world.sessionTokenRequestId !== null
      ? behaviorTreeForPaymentEntity(bb)
      : undefined,
  );
}

export function behaviorTreeForPaymentEntity(bb: BlackboardType) {
  if (!bb.world?.paymentEntity) {
    throw new Error(
      "Payment entity is required to create behavior tree for payment entity",
    );
  }

  switch (bb.world.paymentEntity.entity.status) {
    case "PENDING": {
      return behaviorNode(PePendingBehavior);
    }
    case "REQUIRES_ACTION": {
      return behaviorNode(
        PeRequiresActionBehavior,
        bb.world.paymentEntity.id,
        behaviorTreeForAction(bb),
      );
    }
    case "FAILED":
    case "EXPIRED":
    case "CANCELED": {
      return behaviorNode(PeFailedBehavior);
    }
    case "ACCEPTING_PAYMENTS": {
      // Never happens because sessions don't set the PR type to REUSABLE_PAYMENT_CODE
      throw new Error("Status ACCEPTING_PAYMENTS should not happen");
    }
    case "AUTHORIZED":
    case "ACTIVE":
    case "SUCCEEDED": {
      // The payemnt entity is completed but the session is still active, it should automatically switch to completed soon
      return behaviorNode(PePendingBehavior, bb.world.paymentEntity.id);
    }
    default: {
      bb.world.paymentEntity.entity satisfies never;
      throw new Error(
        `Unknown payment entity status: ${(bb.world.paymentEntity as BffPaymentEntity).entity.status}`,
      );
    }
  }
}

export function behaviorTreeForAction(bb: BlackboardType) {
  if (!bb.world?.paymentEntity) {
    throw new Error("Payment entity is missing");
  }
  if (!bb.world.paymentEntity.entity.actions.length) {
    throw new Error("No actions available while in ACTION_REQUIRED state");
  }

  if (bb.actionCompleted) {
    // action completed is for when we want to close the action UI and go back to polling
    return behaviorNode(ActionCompletedBehavior);
  }

  if (bb.simulatePaymentRequested) {
    return behaviorNode(SimulatePaymentBehavior); // TODO: simulate action should be run in parallel with action behavior
  }

  const action = findBestAction(bb.world.paymentEntity.entity.actions);
  switch (action.type) {
    case "REDIRECT_CUSTOMER": {
      switch (action.descriptor) {
        case "WEB_URL": {
          if (redirectCanBeHandledInIframe(action)) {
            return behaviorNode(ActionIframeBehavior, action.value);
          } else {
            return behaviorNode(ActionRedirectBehavior, action.value);
          }
        }
        case "DEEPLINK_URL": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
        case "WEB_GOOGLE_PAYLINK": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
      }
      break;
    }
    case "PRESENT_TO_CUSTOMER": {
      switch (action.descriptor) {
        case "QR_STRING": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
        case "PAYMENT_CODE": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
        case "VIRTUAL_ACCOUNT_NUMBER": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
      }
      break;
    }
    case "API_POST_REQUEST": {
      switch (action.descriptor) {
        case "CAPTURE_PAYMENT": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
        case "VALIDATE_OTP": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
        case "RESEND_OTP": {
          throw new Error(
            `Unsupported action type ${action.type} ${action.descriptor}`,
          );
        }
      }
      break;
    }
  }
  action satisfies never;
  throw new Error(
    `Unknown action type: ${(action as BffAction).type} ${(action as BffAction).descriptor}`,
  );
}
