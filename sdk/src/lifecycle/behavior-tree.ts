import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { BffAction, BffPaymentEntity } from "../backend-types/payment-entity";
import { BffSession } from "../backend-types/session";
import { pickAction, redirectCanBeHandledInIframe } from "../utils";
import { channelPropertiesAreValid } from "../validation";
import { behaviorNode } from "./behavior-tree-runner";
import {
  ActionIframeBehavior,
  ActionRedirectBehavior,
} from "./behaviors/action";
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
  SubmissionBehavior,
} from "./behaviors/session";

type SdkStatus = "ACTIVE" | "LOADING" | "FATAL_ERROR";

export function behaviorTreeForSdk(data: {
  sdkStatus: SdkStatus;
  session: BffSession | null;
  sessionTokenRequestId: string | null;
  paymentEntity: BffPaymentEntity | null;
  channel: BffChannel | null;
  channelProperties: ChannelProperties | null;
  submissionRequestInFlight: boolean;
}) {
  switch (data.sdkStatus) {
    case "LOADING": {
      return behaviorNode(SdkLoadingBehavior, []);
    }
    case "ACTIVE": {
      if (!data.session) {
        throw new Error("Session is required when SDK is active");
      }
      return behaviorNode(
        SdkActiveBehavior,
        [],
        behaviorTreeForSession({
          ...data,
          session: data.session,
        }),
      );
    }
    case "FATAL_ERROR": {
      return behaviorNode(SdkFatalErrorBehavior, []);
    }
    default: {
      data.sdkStatus satisfies never;
      throw new Error(`Unknown SDK status: ${data.sdkStatus as SdkStatus}`);
    }
  }
}

export function behaviorTreeForSession(data: {
  session: BffSession;
  sessionTokenRequestId: string | null;
  paymentEntity: BffPaymentEntity | null;
  channel: BffChannel | null;
  channelProperties: ChannelProperties | null;
  submissionRequestInFlight: boolean;
}) {
  switch (data.session.status) {
    case "ACTIVE": {
      return behaviorNode(
        SessionActiveBehavior,
        [],
        data.submissionRequestInFlight || data.paymentEntity
          ? behaviorTreeForSubmission(data)
          : behaviorTreeForForm(data),
      );
    }
    case "COMPLETED": {
      return behaviorNode(SessionCompletedBehavior, []);
    }
    case "EXPIRED": {
      return behaviorNode(SessionFailedBehavior, [data.session.status]);
    }
    case "CANCELED": {
      return behaviorNode(SessionFailedBehavior, [data.session.status]);
    }
    default: {
      data.session.status satisfies never;
      throw new Error(
        `Unknown session status: ${(data.session as BffSession).status}`,
      );
    }
  }
}

export function behaviorTreeForForm(data: {
  session: BffSession;
  channel: BffChannel | null;
  channelProperties?: ChannelProperties | null;
}) {
  if (!data.channel) {
    return undefined;
  }

  const showBillingDetails = false; // TODO
  if (
    channelPropertiesAreValid(
      data.session.session_type,
      data.channel,
      data.channelProperties,
      showBillingDetails,
    )
  ) {
    return behaviorNode(ChannelValidBehavior, []);
  } else {
    return behaviorNode(ChannelInvalidBehavior, [
      data.channel?.channel_code ?? null,
    ]);
  }
}

export function behaviorTreeForSubmission(data: {
  sessionTokenRequestId: string | null;
  paymentEntity: BffPaymentEntity | null;
}) {
  return behaviorNode(
    SubmissionBehavior,
    [],
    data.paymentEntity
      ? behaviorTreeForPaymentEntity({
          ...data,
          paymentEntity: data.paymentEntity,
        })
      : undefined,
  );
}

export function behaviorTreeForPaymentEntity(data: {
  sessionTokenRequestId: string | null;
  paymentEntity: BffPaymentEntity;
}) {
  switch (data.paymentEntity.entity.status) {
    case "PENDING": {
      return behaviorNode(PePendingBehavior, [data.sessionTokenRequestId]);
    }
    case "REQUIRES_ACTION": {
      return behaviorNode(
        PeRequiresActionBehavior,
        [data.sessionTokenRequestId],
        behaviorTreeForAction(pickAction(data.paymentEntity.entity.actions)),
      );
    }
    case "FAILED":
    case "EXPIRED":
    case "CANCELED": {
      return behaviorNode(PeFailedBehavior, []);
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
      return behaviorNode(PePendingBehavior, [data.sessionTokenRequestId]);
    }
    default: {
      data.paymentEntity.entity satisfies never;
      throw new Error(
        `Unknown payment entity status: ${(data.paymentEntity as BffPaymentEntity).entity.status}`,
      );
    }
  }
}

export function behaviorTreeForAction(action: BffAction) {
  switch (action.type) {
    case "REDIRECT_CUSTOMER": {
      switch (action.descriptor) {
        case "WEB_URL": {
          if (redirectCanBeHandledInIframe(action)) {
            return behaviorNode(ActionIframeBehavior, [action.value]);
          } else {
            return behaviorNode(ActionRedirectBehavior, [action.value]);
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
