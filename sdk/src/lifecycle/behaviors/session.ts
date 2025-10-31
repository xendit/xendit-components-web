import { createPaymentRequest, createPaymentToken } from "../../api";
import { ChannelProperties } from "../../backend-types/channel";
import {
  BffPaymentRequest,
  BffPaymentToken,
  toPaymentEntity,
} from "../../backend-types/payment-entity";
import { BffSessionStatus } from "../../backend-types/session";
import { Behavior, SdkData } from "../behavior-tree-runner";

export class SessionActiveBehavior implements Behavior {
  private submission: {
    abortController: AbortController;
    promise: Promise<void>;
  } | null;

  constructor(private data: SdkData) {
    this.submission = null;
  }

  enter() {}

  submitCreatePaymentRequest(
    channelCode: string,
    channelProperties: ChannelProperties,
  ) {
    this.data.sdkEvents.setHasInFlightSubmitRequest(true);
    this.submission = {
      abortController: new AbortController(), // TODO: use this to cancel
      promise: createPaymentRequest(
        {
          session_id: this.data.sdkKey.sessionAuthKey,
          channel_code: channelCode,
          channel_properties: channelProperties,
          // TODO: pass customer for VA channels
        },
        null,
      )
        .then((paymentRequest: BffPaymentRequest) => {
          this.data.sdkEvents.updateWorld({
            paymentEntity: toPaymentEntity(paymentRequest),
            sessionTokenRequestId: paymentRequest.session_token_request_id,
          });
        })
        .finally(() => {
          this.submission = null;
          this.data.sdkEvents.setHasInFlightSubmitRequest(false);
        }),
    };
  }

  submitCreatePaymentToken(
    channelCode: string,
    channelProperties: ChannelProperties,
  ) {
    this.data.sdkEvents.setHasInFlightSubmitRequest(true);
    this.submission = {
      abortController: new AbortController(), // TODO: use this to cancel
      promise: createPaymentToken(
        {
          session_id: this.data.sdkKey.sessionAuthKey,
          channel_code: channelCode,
          channel_properties: channelProperties,
        },
        null,
      )
        .then((paymentToken: BffPaymentToken) => {
          this.data.sdkEvents.updateWorld({
            paymentEntity: toPaymentEntity(paymentToken),
            sessionTokenRequestId: paymentToken.session_token_request_id,
          });
        })
        .finally(() => {
          this.submission = null;
          this.data.sdkEvents.setHasInFlightSubmitRequest(false);
        }),
    };
  }

  abortSubmission() {
    this.submission?.abortController.abort();
    this.submission = null;
  }

  exit() {
    this.abortSubmission();
  }
}

export class SubmissionBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    this.data.sdkEvents.setSubmitting(true);
  }
  exit() {
    this.data.sdkEvents.setSubmitting(false);
  }
}

export class SessionCompletedBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    this.data.sdkEvents.setSessionState("COMPLETED");
  }
}

export class SessionFailedBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private sessionStatus: BffSessionStatus,
  ) {}

  enter() {
    this.data.sdkEvents.setSessionState(this.sessionStatus);
  }
}
