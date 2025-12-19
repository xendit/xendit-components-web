import { createPaymentRequest, createPaymentToken } from "../../api";
import { ChannelProperties } from "../../backend-types/channel";
import {
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequest,
  BffPaymentToken,
  getFailureCodeCopyKey,
  getPaymentEntityStatusCopyKey,
  toPaymentEntity,
} from "../../backend-types/payment-entity";
import { BffSessionType } from "../../backend-types/session";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import {
  XenditPaymentRequestCreatedEvent,
  XenditPaymentRequestDiscardedEvent,
  XenditPaymentTokenCreatedEvent,
  XenditPaymentTokenDiscardedEvent,
  XenditSubmissionBeginEvent,
  XenditSubmissionEndEvent,
} from "../../public-event-types";
import { makeTestPaymentRequest, makeTestPaymentToken } from "../../test-data";
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
import { FailureContent, NetworkError } from "../../networking";

export class SubmissionBehavior implements Behavior {
  private exited = false;

  private submission: {
    abortController: AbortController;
    promise: Promise<void>;
  } | null;
  private submissionHadError = false;
  private networkError: NetworkError | null = null;

  constructor(private bb: BlackboardType) {
    this.submission = null;
    this.networkError = null;
  }

  enter() {
    this.bb.dispatchEvent(new XenditSubmissionBeginEvent());
    this.bb.sdkEvents.scheduleMockUpdate("NONE");
    this.submit();
  }

  exit() {
    this.exited = true;

    assert(this.bb.world?.session);

    // If session is not complete, discard payment entity
    const paymentEntity = this.bb.world.paymentEntity;
    if (this.bb.world.session.status !== "COMPLETED" && paymentEntity) {
      switch (paymentEntity.type) {
        case BffPaymentEntityType.PaymentRequest:
          this.bb.dispatchEvent(
            new XenditPaymentRequestDiscardedEvent(paymentEntity.id),
          );
          break;
        case BffPaymentEntityType.PaymentToken:
          this.bb.dispatchEvent(
            new XenditPaymentTokenDiscardedEvent(paymentEntity.id),
          );
          break;
        default:
          paymentEntity satisfies never;
      }
      this.bb.sdkEvents.updateWorld({
        paymentEntity: null,
        sessionTokenRequestId: null,
      });
    }

    // Send event for submission end
    let reason: string;
    let failure: FailureContent | null = null;
    if (this.bb.world && this.bb.world.session.status !== "ACTIVE") {
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
      const t = this.bb.sdkEvents.sdk.t;
      const status = paymentEntity.entity.status;

      const failureCode = paymentEntity.entity.failure_code;
      const title = t(
        getPaymentEntityStatusCopyKey(paymentEntity.type, status, "title"),
      );
      const subtext = failureCode
        ? t(
            getFailureCodeCopyKey(failureCode),
            t("failure_code_unknown", { failureCode }),
          )
        : t(
            getPaymentEntityStatusCopyKey(
              paymentEntity.type,
              status,
              "subtext",
            ),
          );
      failure = { title, subtext, failureCode };
    } else if (this.submissionHadError) {
      // there was an error during submission
      reason = "REQUEST_FAILED";
    } else if (this.submission) {
      // the a submission is cancelled during the request
      reason = "REQUEST_ABORTED";
    } else {
      // the submission was cancelled during an action
      reason = "ACTION_ABORTED";
    }

    // Dispatch submission end event with error details if available
    if (this.submissionHadError && this.networkError) {
      const t = this.bb.sdkEvents.sdk.t;
      if (this.networkError.isDefaultError) {
        this.bb.dispatchEvent(
          new XenditSubmissionEndEvent(reason, {
            errorContent: {
              title: t("default_error.title"),
              message_1: t("default_error.message_1"),
              message_2: t("default_error.message_2"),
            },
          }),
        );
      } else if (this.networkError.errorContent) {
        this.bb.dispatchEvent(
          new XenditSubmissionEndEvent(reason, {
            errorCode: this.networkError.errorCode,
            errorContent: this.networkError.errorContent,
          }),
        );
      }
    } else {
      this.bb.dispatchEvent(
        new XenditSubmissionEndEvent(reason, {
          failure: failure || undefined,
        }),
      );
    }

    // Abort ongoing submission request
    if (this.submission) {
      this.submission?.abortController.abort(new AbortError());
      this.submission = null;
    }

    // Ensure submit flag is reset
    this.bb.submissionRequested = false;
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
    const channelProperties = this.bb.channelProperties ?? {};
    const abortController = new AbortController();
    const promise = asyncSubmit(
      this.bb.sdkKey,
      this.bb.mock,
      sessionType,
      channelCode,
      channelProperties,
      abortController,
      shouldSendSavePaymentMethod
        ? this.bb.savePaymentMethod || false
        : undefined,
    )
      .then((paymentEntity: BffPaymentEntity) => {
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
        this.bb.sdkEvents.updateWorld({
          paymentEntity,
          sessionTokenRequestId: paymentEntity.entity.session_token_request_id,
        });
      })
      .catch((error) => {
        if (isAbortError(error)) return;

        console.error("Submission failed:", error);
        if (error instanceof NetworkError) {
          this.networkError = error;
        }

        // avoid dispatching an event after exit
        if (!this.exited) {
          // set the error flag and exit the submission
          this.bb.submissionRequested = false;
          this.submissionHadError = true;
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
  channelProperties: ChannelProperties,
  abortController: AbortController,
  savePaymentMethod: boolean = false,
): Promise<BffPaymentEntity> {
  let result: BffPaymentToken | BffPaymentRequest;
  if (mock) {
    // mock implementation
    switch (sessionType) {
      case "PAY": {
        await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortController.signal);
        result = makeTestPaymentRequest(channelCode);
        break;
      }
      case "SAVE": {
        await cancellableSleep(MOCK_NETWORK_DELAY_MS, abortController.signal);
        result = makeTestPaymentToken(channelCode);
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
