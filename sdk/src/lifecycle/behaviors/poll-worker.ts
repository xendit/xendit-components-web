import { pollSession } from "../../api";
import { BffPollResponse } from "../../backend-types/common";
import { BffPaymentEntity } from "../../backend-types/payment-entity";
import { retryLoop, sleep } from "../../utils";

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
  stopped = false;

  constructor(
    private sessionAuthKey: string,
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

    // retry loop with exponential backoff
    // chart of retry times:
    // https://www.desmos.com/calculator/3sihry02vd
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const attempt of retryLoop(5000, 100, 1.06)) {
      if (this.stopped) return;

      let response: BffPollResponse;
      try {
        response = await pollSession(
          this.sessionAuthKey,
          this.sessionTokenRequestId,
        );
      } catch (_err) {
        // TODO: error handling
        continue;
      }
      if (this.stopped) return;

      if (!response.session) {
        throw new Error("Session is not defined"); // should be impossible
      }

      let paymentEntity: BffPaymentEntity | null = null;
      if (response.payment_token) {
        paymentEntity = {
          type: "paymentToken",
          entity: response.payment_token,
        };
      } else if (response.payment_request) {
        paymentEntity = {
          type: "paymentRequest",
          entity: response.payment_request,
        };
      }

      this.onPollResult(response, paymentEntity);

      // give the caller a chance to stop before we make the next request
      await sleep(1);
    }
  }

  stop() {
    this.stopped = true;
  }
}
