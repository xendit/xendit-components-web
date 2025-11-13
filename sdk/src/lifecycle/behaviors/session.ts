import { createPaymentRequest, createPaymentToken } from "../../api";
import { ChannelProperties } from "../../backend-types/channel";
import {
  BffPaymentRequest,
  BffPaymentToken,
  toPaymentEntity,
} from "../../backend-types/payment-entity";
import { BffSessionStatus, BffSessionType } from "../../backend-types/session";
import { makeTestPaymentRequest, makeTestPaymentToken } from "../../test-data";
import { cancellableSleep } from "../../utils";
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

  submit(
    sessionType: BffSessionType,
    channelCode: string,
    channelProperties: ChannelProperties,
  ) {
    this.data.sdkEvents.setHasInFlightSubmitRequest(true);

    const abortController = new AbortController();

    let promise1: Promise<BffPaymentRequest | BffPaymentToken>;
    if (this.data.mock) {
      // mock implementation
      switch (sessionType) {
        case "PAY": {
          promise1 = cancellableSleep(1000, abortController.signal).then(() => {
            return makeTestPaymentRequest(channelCode);
          });
          break;
        }
        case "SAVE": {
          promise1 = cancellableSleep(1000, abortController.signal).then(() => {
            return makeTestPaymentToken(channelCode);
          });
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
          promise1 = createPaymentRequest(
            {
              session_id: this.data.sdkKey.sessionAuthKey,
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
          promise1 = createPaymentToken(
            {
              session_id: this.data.sdkKey.sessionAuthKey,
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

    const promise2 = promise1
      .then((prOrPt: BffPaymentRequest | BffPaymentToken) => {
        this.data.sdkEvents.updateWorld({
          paymentEntity: toPaymentEntity(prOrPt),
          sessionTokenRequestId: prOrPt.session_token_request_id,
        });
      })
      .finally(() => {
        this.submission = null;
        this.data.sdkEvents.setHasInFlightSubmitRequest(false);
      });

    this.submission = {
      abortController,
      promise: promise2,
    };
  }

  abortSubmission() {
    this.submission?.abortController.abort("Aborted");
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
    this.data.sdkEvents.scheduleMockUpdate("NONE");
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
