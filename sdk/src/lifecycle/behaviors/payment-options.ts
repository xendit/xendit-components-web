import { getPaymentOptions } from "../../api";
import { BffPaymentOptions } from "../../backend-types/payment-options";
import { BffSession } from "../../backend-types/session";
import { makeMockPaymentOptions } from "../../data/test-data-modifiers";
import { InternalUpdateChannelComponentData } from "../../private-event-types";
import {
  AbortError,
  assert,
  cancellableSleep,
  formHasFieldOfType,
  getCardNumberFromChannelProperties,
  isAbortError,
  MOCK_NETWORK_DELAY_MS,
  ParsedSdkKey,
  parseEncryptedFieldValue,
} from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class PaymentOptionsBehavior implements Behavior {
  private paymentOptionsRequest: {
    cardNumber: string | undefined;
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  constructor(
    public bb: BlackboardType,
    private channelCode: string,
  ) {}

  enter() {
    this.lookupPaymentOptions();
  }

  update() {
    this.lookupPaymentOptions();
  }

  exit() {
    this.abortLookupPaymentOptions();
  }

  abortLookupPaymentOptions() {
    if (this.paymentOptionsRequest) {
      this.paymentOptionsRequest.abortController.abort(new AbortError());
      this.paymentOptionsRequest = null;
    }
  }

  lookupPaymentOptions() {
    assert(this.bb.world);
    assert(this.bb.channel);

    let cardNumber: string | undefined;
    if (formHasFieldOfType(this.bb.channel, "credit_card_number")) {
      cardNumber =
        getCardNumberFromChannelProperties(this.bb.channelProperties) ??
        undefined;

      // don't look up payment options if there's a card number field but it's not filled in
      if (!cardNumber) {
        return;
      }

      // don't look up the payment options if a request is in flight for the same card number
      if (this.paymentOptionsRequest?.cardNumber === cardNumber) {
        return;
      }

      // don't look up the payment options if we already have them for the same card numnber (including null)
      if (
        this.bb.channelData?.paymentOptions?.cardNumber ??
        null === cardNumber
      ) {
        return;
      }

      // don't look up payment options if the card number is invalid
      if (cardNumber) {
        const parsed = parseEncryptedFieldValue(cardNumber);
        if (!parsed.valid) {
          return;
        }
      }
    } else {
      // channel does not have a card number field, skip if any request is complete or in flight
      if (this.paymentOptionsRequest || this.bb.channelData?.paymentOptions) {
        return;
      }
    }

    if (this.paymentOptionsRequest) {
      this.abortLookupPaymentOptions();
    }

    const abortController = new AbortController();
    const promise = getPaymentOptionsAsync(
      this.bb.sdkKey,
      this.bb.world.session,
      this.bb.channel.channel_code,
      cardNumber,
      abortController.signal,
      this.bb.mock,
    )
      .then((response) => {
        this.bb.dispatchEvent(
          new InternalUpdateChannelComponentData(this.channelCode, {
            paymentOptions: {
              cardNumber: cardNumber ?? null,
              options: response,
            },
          }),
        );
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        throw error;
      });

    this.paymentOptionsRequest = {
      cardNumber: cardNumber ?? undefined,
      promise,
      abortController,
    };
  }
}

async function getPaymentOptionsAsync(
  sdkKey: ParsedSdkKey,
  session: BffSession,
  channelCode: string,
  cardNumber: string | undefined,
  abortSignal: AbortSignal,
  mock: boolean,
): Promise<BffPaymentOptions> {
  if (mock) {
    // mock implementation
    return cancellableSleep(MOCK_NETWORK_DELAY_MS, abortSignal).then(() => {
      return makeMockPaymentOptions(channelCode, session);
    });
  } else {
    // real implementation
    const body = {
      channel_code: channelCode,
      channel_properties: cardNumber
        ? {
            card_number: cardNumber,
          }
        : undefined,
    };
    return getPaymentOptions(
      sdkKey,
      body,
      sdkKey.sessionAuthKey,
      null,
      abortSignal,
    );
  }
}
