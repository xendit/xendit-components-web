import { createPaymentRequest, createPaymentToken } from "../../api";
import { ChannelProperties } from "../../backend-types/channel";
import {
  BffPaymentEntity,
  BffPaymentEntityType,
  BffPaymentRequest,
  BffPaymentToken,
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
  assert,
  cancellableSleep,
  MOCK_NETWORK_DELAY_MS,
  ParsedSdkKey,
} from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

const ABORT_ERROR_NAME = "AbortError";

export class SubmissionBehavior implements Behavior {
  private exited = false;

  private submission: {
    abortController: AbortController;
    promise: Promise<void>;
  } | null;
  private submissionHadError = false;

  constructor(private bb: BlackboardType) {
    this.submission = null;
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
    if (
      this.bb.world.session.status !== "COMPLETED" &&
      this.bb.world.paymentEntity
    ) {
      const paymentEntity = this.bb.world.paymentEntity;
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
    let reason;
    if (this.bb.world && this.bb.world.session.status !== "ACTIVE") {
      // if status is not active, that's why we ended submission
      reason = `SESSION_${this.bb.world.session.status}`;
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
    this.bb.dispatchEvent(new XenditSubmissionEndEvent(reason));

    // Abort ongoing submission request
    if (this.submission) {
      this.submission?.abortController.abort(ABORT_ERROR_NAME);
      this.submission = null;
    }

    // Ensure submit flag is reset
    this.bb.submissionRequested = false;
  }

  private submit() {
    if (!this.bb.world?.session || !this.bb.channel) {
      throw new Error("Session object missing");
    }

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
      .finally(() => {
        this.submission = null;
      })
      .catch((error) => {
        console.error("Submission failed:", error);

        if (!this.exited) {
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
