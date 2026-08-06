import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { BffAction, BffPaymentEntity } from "../backend-types/payment-entity";
import { BffSession } from "../backend-types/session";
import {
  ChannelComponentData,
  WorldState,
  XenditComponents,
} from "../public-sdk";
import {
  assert,
  canBeSimulated,
  findBestAction,
  findPaylinkAction,
  formHasFieldOfType,
  ParsedSdkKey,
  redirectCanBeHandledInIframe,
} from "../utils";
import { channelPropertiesAreValid } from "../validation";
import { behaviorNode } from "./behavior-tree-runner";
import { ActionCompletedBehavior } from "./behaviors/action-completed";
import { ActionDeepLinkBehavior } from "./behaviors/action-deep-link";
import { ActionEmptyListPushNotificationBehavior } from "./behaviors/action-empty-list-push-notification";
import { ActionIframeBehavior } from "./behaviors/action-iframe";
import { ActionBarcodeBehavior } from "./behaviors/action-barcode";
import { ActionPaylinkBehavior } from "./behaviors/action-paylink";
import { ActionQrBehavior } from "./behaviors/action-qr";
import { ActionRedirectBehavior } from "./behaviors/action-redirect";
import { ActionVaBehavior } from "./behaviors/action-va";
import { CardInfoBehavior } from "./behaviors/card-info";
import { ChannelInvalidBehavior } from "./behaviors/channel-invalid";
import { ChannelValidBehavior } from "./behaviors/channel-valid";
import { PaymentEntityFailedBehavior } from "./behaviors/payment-entity-failed";
import { PaymentEntityPendingBehavior } from "./behaviors/payment-entity-pending";
import { PaymentEntityRequiresActionBehavior } from "./behaviors/payment-entity-requires-action";
import { PaymentOptionsBehavior } from "./behaviors/payment-options";
import { SdkActiveBehavior } from "./behaviors/sdk-active";
import { SdkFatalErrorBehavior } from "./behaviors/sdk-fatal-error";
import { SdkLoadingBehavior } from "./behaviors/sdk-loading";
import { SessionActiveBehavior } from "./behaviors/session-active";
import { SessionCompletedBehavior } from "./behaviors/session-completed";
import { SessionFailedBehavior } from "./behaviors/session-failed";
import { SessionPendingBehavior } from "./behaviors/session-pending";
import { SimulatePaymentBehavior } from "./behaviors/simulate-payment";
import { SubmissionBehavior, SubmissionError } from "./behaviors/submission";

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
  sdkFatalErrorRetryable: boolean;
  channel: BffChannel | null;
  channelProperties: ChannelProperties | null;
  channelData: ChannelComponentData | null;
  channelIsDigitalWallet: boolean;
  instantSubmissionError: SubmissionError | null;

  // dispatch event on the SDK instance
  dispatchEvent(event: Event): boolean;

  // flags
  // if true, start a submission, if false abort submission
  submissionRequested: boolean;
  // if true, the SDK is resuming a previous (failed) payment attempt after a
  // redirect; skip submitting and let the tree route straight to the failure
  // behavior. Distinct from submissionRequested, which means "submit now".
  resuming: boolean;
  // if true, start simulate payment, if false abort simulate payment
  simulatePaymentRequested: boolean;
  // if true, do not show the current action UI
  actionCompleted: boolean;
  // if true, poll the payment entity immediately on the next update
  pollImmediatelyRequested: boolean;
  // if true, don't exit ovo's and jeniuspay's ActionEmptyListPushNotificationBehavior when the payment request status changes to pending
  hackyOvoActionLatch?: boolean;
};

export function behaviorTreeForSdk(bb: BlackboardType) {
  switch (bb.sdkStatus) {
    case "LOADING": {
      return behaviorNode(SdkLoadingBehavior);
    }
    case "ACTIVE": {
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
  assert(bb.world?.session);

  switch (bb.world.session.status) {
    case "ACTIVE": {
      return behaviorNode(
        SessionActiveBehavior,
        "active",
        bb.submissionRequested || bb.resuming
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
    case "PENDING": {
      return behaviorNode(SessionPendingBehavior, bb.world.session.status);
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

  if (bb.channelIsDigitalWallet) {
    return undefined;
  }

  const channelPropertiesValid = channelPropertiesAreValid(
    bb.world.session.session_type,
    bb.channel,
    bb.channelProperties,
    bb.channelData,
  );
  const requiresCustomerDetails =
    bb.channel.requires_customer_details && !bb.world.customer;
  let customerDetailsValid = true;
  if (requiresCustomerDetails) {
    // for now we only require given names for customer details
    customerDetailsValid =
      bb.channelData?.customerDetails?.given_names?.trim().length !== 0;
  }

  const validityBehavior =
    channelPropertiesValid && customerDetailsValid
      ? behaviorNode(ChannelValidBehavior)
      : behaviorNode(ChannelInvalidBehavior);

  const cardInfoBehavior = formHasFieldOfType(
    bb.channel.form,
    "credit_card_number",
  )
    ? behaviorNode(CardInfoBehavior, bb.channel.channel_code)
    : undefined;

  const paymentOptionsBehavior = formHasFieldOfType(
    bb.channel.form,
    "installment_plan",
  )
    ? behaviorNode(PaymentOptionsBehavior, bb.channel.channel_code)
    : undefined;

  return [validityBehavior, cardInfoBehavior, paymentOptionsBehavior];
}

export function behaviorTreeForSubmission(bb: BlackboardType) {
  assert(bb.world);

  return behaviorNode(
    SubmissionBehavior,
    "submission",
    bb.world.paymentEntity && bb.world.sessionTokenRequestId !== null
      ? behaviorTreeForPaymentEntity(bb)
      : undefined,
  );
}

export function behaviorTreeForPaymentEntity(bb: BlackboardType) {
  assert(bb.world?.paymentEntity);

  function maybePaylinkAction() {
    assert(bb.world?.paymentEntity);
    if (bb.resuming) return undefined;
    return findPaylinkAction(bb.sdk, bb.world.paymentEntity.entity.actions)
      ? behaviorTreeForPaylink(bb)
      : undefined;
  }

  if (
    bb.hackyOvoActionLatch &&
    bb.world.paymentEntity.entity.status === "PENDING"
  ) {
    // In ovo and jeniuspay, the REQUIRES_ACTION status changes to PENDING almost immediately, causing the instructions to the user to close.
    // We need to keep this behavior alive until the status changes to something other than PENDING.
    return behaviorNode(
      PaymentEntityRequiresActionBehavior,
      bb.world.paymentEntity.id,
      [
        behaviorNode(ActionEmptyListPushNotificationBehavior, ""),
        maybePaylinkAction(),
      ],
    );
  }

  switch (bb.world.paymentEntity.entity.status) {
    case "PENDING": {
      return behaviorNode(PaymentEntityPendingBehavior);
    }
    case "REQUIRES_ACTION": {
      return behaviorNode(
        PaymentEntityRequiresActionBehavior,
        bb.world.paymentEntity.id,
        [behaviorTreeForAction(bb), maybePaylinkAction()],
      );
    }
    case "FAILED":
    case "EXPIRED":
    case "CANCELED": {
      return behaviorNode(PaymentEntityFailedBehavior);
    }
    case "ACCEPTING_PAYMENTS": {
      // Never happens because sessions don't set the PR type to REUSABLE_PAYMENT_CODE
      throw new Error("Status ACCEPTING_PAYMENTS should not happen");
    }
    case "AUTHORIZED":
    case "ACTIVE":
    case "SUCCEEDED": {
      // The payemnt entity is completed but the session is still active, it should automatically switch to completed soon
      return behaviorNode(
        PaymentEntityPendingBehavior,
        bb.world.paymentEntity.id,
      );
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
  assert(bb.world?.paymentEntity);

  if (bb.actionCompleted || bb.resuming) {
    // action completed is for when we want to close the action UI and go back to polling
    return behaviorNode(ActionCompletedBehavior);
  }

  const action = findBestAction(bb.world.paymentEntity.entity.actions);

  if (!action) {
    // an empty list of actions means we prompt the user to tap a push notification
    return behaviorNode(ActionEmptyListPushNotificationBehavior, "");
  }

  const actionIndex = bb.world.paymentEntity.entity.actions.indexOf(action);
  const hasPaylink = !!findPaylinkAction(
    bb.sdk,
    bb.world.paymentEntity.entity.actions,
  );

  // adds simulate payment behavior as a child of the action behavior so that when
  // simulate payment is requested, it will run the simulate payment behavior while
  // keeping the action UI open until the payment entity updates
  let simulateBehavior = undefined;
  if (bb.simulatePaymentRequested && canBeSimulated(action)) {
    simulateBehavior = behaviorNode(SimulatePaymentBehavior);
  }

  switch (action.type) {
    case "REDIRECT_CUSTOMER": {
      switch (action.descriptor) {
        case "WEB_URL": {
          if (redirectCanBeHandledInIframe(action)) {
            return behaviorNode(ActionIframeBehavior, action.value);
          } else if (hasPaylink) {
            return behaviorNode(ActionDeepLinkBehavior, String(actionIndex));
          } else {
            return behaviorNode(ActionRedirectBehavior, action.value);
          }
        }
        case "DEEPLINK_URL": {
          return behaviorNode(ActionDeepLinkBehavior, String(actionIndex));
        }
        case "WEB_GOOGLE_PAYLINK": {
          throw new Error(`Paylink actions should not be the primary action`);
        }
      }
      break;
    }
    case "PRESENT_TO_CUSTOMER": {
      switch (action.descriptor) {
        case "QR_STRING": {
          return behaviorNode(
            ActionQrBehavior,
            String(actionIndex),
            simulateBehavior,
          );
        }
        case "PAYMENT_CODE": {
          return behaviorNode(
            ActionBarcodeBehavior,
            String(actionIndex),
            simulateBehavior,
          );
        }
        case "VIRTUAL_ACCOUNT_NUMBER": {
          return behaviorNode(
            ActionVaBehavior,
            String(actionIndex),
            simulateBehavior,
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

function behaviorTreeForPaylink(bb: BlackboardType) {
  assert(bb.world?.paymentEntity);

  const paylinkAction = findPaylinkAction(
    bb.sdk,
    bb.world.paymentEntity.entity.actions,
  );
  assert(paylinkAction);

  const actionIndex =
    bb.world.paymentEntity.entity.actions.indexOf(paylinkAction);
  return behaviorNode(ActionPaylinkBehavior, String(actionIndex));
}
