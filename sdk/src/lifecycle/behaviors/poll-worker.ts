import { pollSession } from "../../api";
import { BffPollResponse } from "../../backend-types/common";
import {
  BffPaymentEntity,
  toPaymentEntity,
} from "../../backend-types/payment-entity";
import { XenditComponents, XenditComponentsTest } from "../../public-sdk";
import {
  MOCK_NETWORK_DELAY_MS,
  ParsedSdkKey,
  retryLoop,
  sleep,
} from "../../utils";

/**
 * Polls the session status forever until stop() is called.
 *
 * @example
 * const poller = new PollWorker(sessionId, tokenRequestId, (updatedSession) => {
 *   // handle session update
 * }, () => {
 *   // handle error
 * });
 *
 * poller.start();
 * // later
 * poller.stop();
 */
export class PollWorker {
  started = false;
  stopped = false;

  constructor(
    private sdkKey: ParsedSdkKey,
    private sdk: XenditComponents,
    private sessionTokenRequestId: string | null,
    private onPollResult: (
      result: BffPollResponse,
      paymentEntity: BffPaymentEntity | null,
    ) => void,
  ) {}

  async start() {
    if (this.stopped) {
      throw new Error(
        "PollWorker has been stopped, make a new instance instead of calling start again",
      );
    }
    this.started = true;

    // retry loop with exponential backoff
    // chart of retry times:
    // https://www.desmos.com/calculator/3sihry02vd
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const attempt of retryLoop(5000, 100, 1.06)) {
      if (this.stopped) return;

      let response: BffPollResponse;

      if (this.sdk.isMock()) {
        // mock polling
        if (
          this.sdk instanceof XenditComponentsTest &&
          this.sdk.nextMockUpdate
        ) {
          await sleep(MOCK_NETWORK_DELAY_MS); // simulate network delay
          response = this.sdk.nextMockUpdate;
          this.sdk.nextMockUpdate = null;
        } else {
          continue;
        }
      } else {
        // real polling request
        try {
          response = await pollSession(
            this.sdkKey,
            this.sdkKey.sessionAuthKey,
            this.sessionTokenRequestId,
          );
        } catch (_err) {
          // TODO: error handling
          continue;
        }
      }
      if (this.stopped) return;

      if (!response.session) {
        throw new Error("Session is not defined"); // should be impossible
      }

      let paymentEntity: BffPaymentEntity | null = null;
      if (response.payment_token) {
        paymentEntity = toPaymentEntity(response.payment_token);
      } else if (response.payment_request) {
        paymentEntity = toPaymentEntity(response.payment_request);
      }

      this.onPollResult(response, paymentEntity);

      // give the caller a chance to stop before we make the next request
      await sleep(1);
    }
  }

  isPolling() {
    return this.started && !this.stopped;
  }

  stop() {
    this.started = false;
    this.stopped = true;
  }
}
