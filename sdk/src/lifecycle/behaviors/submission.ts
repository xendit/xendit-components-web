import { createPaymentRequest, createPaymentToken } from "../../api";
import { ChannelProperties, MockActionType } from "../../backend-types/channel";
import {
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequest,
  BffPaymentRequestFailureCode,
  BffPaymentToken,
  BffPaymentTokenFailureCode,
  getFailureCodeCopyKey,
  getPaymentEntityStatusCopyKey,
  toPaymentEntity,
} from "../../backend-types/payment-entity";
import { BffSessionType } from "../../backend-types/session";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalNeedsRerenderEvent,
  InternalScheduleMockUpdateEvent,
  InternalUpdateWorldState,
} from "../../private-event-types";
import {
  XenditPaymentRequestCreatedEvent,
  XenditPaymentTokenCreatedEvent,
  XenditSubmissionBeginEvent,
  XenditSubmissionEndEvent,
} from "../../public-event-types";
import {
  makeTestPaymentRequest,
  makeTestPaymentToken,
} from "../../data/test-data-modifiers";
import {
  AbortError,
  assert,
  cancellableSleep,
  isAbortError,
  MOCK_NETWORK_DELAY_MS,
  ParsedSdkKey,
} from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { NetworkError } from "../../networking";
import { TFunction } from "i18next";
import { discardPaymentEntity } from "./discard";

export class SubmissionBehavior implements Behavior {
  private exited = false;

  private submission: {
    abortController: AbortController;
    promise: Promise<void>;
  } | null = null;
  private submissionError: Error | NetworkError | null = null;

  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditSubmissionBeginEvent());
    this.bb.dispatchEvent(new InternalScheduleMockUpdateEvent(null));
    this.submit();
  }

  exit() {
    this.exited = true;

    assert(this.bb.world?.session);
    const t = this.bb.sdk.t;

    // If session is not complete or pending, discard payment entity
    const paymentEntity = this.bb.world.paymentEntity;
    if (
      this.bb.world.session.status !== "COMPLETED" &&
      this.bb.world.session.status !== "PENDING" &&
      paymentEntity
    ) {
      discardPaymentEntity(paymentEntity, this.bb.dispatchEvent);
    }

    // Determine reason for submission end
    let reason: string;
    let userErrorMessage: string[] | undefined = undefined;
    let developerErrorMessage:
      | {
          type: "NETWORK_ERROR" | "ERROR" | "FAILURE";
          code: string;
        }
      | undefined = undefined;

    if (this.bb.world.session.status !== "ACTIVE") {
      // if status is not active, that's why we ended submission
      reason = `SESSION_${this.bb.world.session.status}`;
    } else if (
      paymentEntity &&
      (paymentEntity.entity.status === "FAILED" ||
        paymentEntity.entity.status === "CANCELED" ||
        paymentEntity.entity.status === "EXPIRED")
    ) {
      // the payment entity failed, was canceled or expired
      reason = `PAYMENT_${paymentEntity.type}_${paymentEntity.entity.status}`;
      userErrorMessage = failureCodeUserErrorMessage(
        t,
        paymentEntity.type,
        paymentEntity.entity.status,
        paymentEntity.entity.failure_code,
      );
      developerErrorMessage = {
        type: "FAILURE",
        code: paymentEntity.entity.failure_code ?? "UNKNOWN",
      };
    } else if (this.submissionError) {
      // there was an error during submission
      reason = "REQUEST_FAILED";
      if (this.submissionError instanceof NetworkError) {
        // error code from server
        userErrorMessage = [
          this.submissionError.errorResponse.error_content?.title,
          this.submissionError.errorResponse.error_content?.message_1,
          this.submissionError.errorResponse.error_content?.message_2,
        ].filter((str) => str !== undefined);
        developerErrorMessage = {
          type: "ERROR",
          code: this.submissionError.errorResponse.error_code || "UNKNOWN",
        };
      } else {
        // unknown or network error
        userErrorMessage = defaultUserErrorMessage(t);
        developerErrorMessage = {
          type: "NETWORK_ERROR",
          code: "NETWORK_ERROR",
        };
      }
    } else if (this.submission) {
      // the submission is canceled during the request
      reason = "REQUEST_ABORTED";
    } else {
      // the submission was canceled during an action
      reason = "ACTION_ABORTED";
    }

    // Dispatch submission end event
    this.bb.dispatchEvent(
      new XenditSubmissionEndEvent(
        reason,
        userErrorMessage,
        developerErrorMessage,
      ),
    );

    // Abort ongoing submission request (the error will be ignored)
    if (this.submission) {
      this.submission?.abortController.abort(new AbortError());
      this.submission = null;
    }

    // Ensure submit flags are reset
    this.bb.submissionRequested = false;

    // Schedule rerender (to clear the inert attribute on the active component)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  private submit() {
    if (!this.bb.world?.session || !this.bb.channel) {
      throw new Error("Session object missing");
    }

    const shouldSendSavePaymentMethod =
      this.bb.world.session.allow_save_payment_method === "OPTIONAL" &&
      this.bb.channel?.allow_save;
    const sessionType = this.bb.world?.session?.session_type;
    const channelCode = this.bb.channel.channel_code;
    const mockActionType = this.bb.channel._mock_action_type;
    const channelProperties = this.bb.channelProperties ?? {};
    const abortController = new AbortController();
    const promise = asyncSubmit(
      this.bb.sdkKey,
      this.bb.mock,
      sessionType,
      channelCode,
      mockActionType,
      channelProperties,
      abortController,
      shouldSendSavePaymentMethod
        ? (this.bb.channelData?.savePaymentMethod ?? false)
        : undefined,
    )
      .then((paymentEntity: BffPaymentEntity) => {
        // clear abort controller since the request is complete
        this.submission = null;

        switch (paymentEntity.type) {
          case BffPaymentEntityType.PaymentRequest:
            this.bb.dispatchEvent(
              new XenditPaymentRequestCreatedEvent(paymentEntity.id),
            );
            break;
          case BffPaymentEntityType.PaymentToken:
            this.bb.dispatchEvent(
              new XenditPaymentTokenCreatedEvent(paymentEntity.id),
            );
            break;
          default:
            paymentEntity satisfies never;
        }

        // TODO: the payment-entity-created event should be sent only after the updateWorld call but that causes a behavior tree update which would cause events to fire in the wrong order
        this.bb.dispatchEvent(
          new InternalUpdateWorldState({
            paymentEntity,
            sessionTokenRequestId:
              paymentEntity.entity.session_token_request_id,
          }),
        );
      })
      .catch((error) => {
        if (isAbortError(error)) return;

        console.error("Submission failed:", error);

        // avoid dispatching an event after exit
        if (!this.exited) {
          // set the error flag and exit the submission
          this.bb.submissionRequested = false;
          this.submissionError = error;
          this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
        }
      });

    this.submission = {
      abortController,
      promise,
    };
  }
}

async function asyncSubmit(
  sdkKey: ParsedSdkKey,
  mock: boolean,
  sessionType: BffSessionType,
  channelCode: string,
  mockActionType: MockActionType | undefined,
  channelProperties: ChannelProperties,
  abortController: AbortController,
  savePaymentMethod: boolean | undefined,
): Promise<BffPaymentEntity> {
  let result: BffPaymentToken | BffPaymentRequest;
  if (mock) {
    // mock implementation
    switch (sessionType) {
      case "PAY": {
        await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortController.signal);
        result = makeTestPaymentRequest(channelCode, mockActionType);
        break;
      }
      case "SAVE": {
        await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortController.signal);
        result = makeTestPaymentToken(channelCode, mockActionType);
        break;
      }
      default: {
        throw new Error(`The session type ${sessionType} is not supported.`);
      }
    }
  } else {
    // real implementation
    switch (sessionType) {
      case "PAY": {
        result = await createPaymentRequest(
          sdkKey,
          {
            session_id: sdkKey.sessionAuthKey,
            channel_code: channelCode,
            channel_properties: channelProperties,
            save_payment_method: savePaymentMethod,
            // TODO: pass customer for VA channels
          },
          null,
          null,
          abortController.signal,
        );
        break;
      }
      case "SAVE": {
        result = await createPaymentToken(
          sdkKey,
          {
            session_id: sdkKey.sessionAuthKey,
            channel_code: channelCode,
            channel_properties: channelProperties,
          },
          null,
          null,
          abortController.signal,
        );
        break;
      }
      default: {
        throw new Error(`The session type ${sessionType} is not supported.`);
      }
    }
  }

  return toPaymentEntity(result);
}

function defaultUserErrorMessage(t: TFunction<"session">): string[] {
  return [
    t("default_error.title"),
    t("default_error.message_1"),
    t("default_error.message_2"),
  ];
}

function failureCodeUserErrorMessage(
  t: TFunction<"session">,
  type: BffPaymentEntityType,
  status: "FAILED" | "EXPIRED" | "CANCELED",
  failureCode:
    | BffPaymentTokenFailureCode
    | BffPaymentRequestFailureCode
    | undefined,
): string[] {
  const title = t(getPaymentEntityStatusCopyKey(type, status, "title"));
  const subtext = failureCode
    ? t(
        getFailureCodeCopyKey(failureCode),
        t("failure_code_unknown", { failureCode }),
      )
    : t(getPaymentEntityStatusCopyKey(type, status, "subtext"));
  return [title, subtext];
}
