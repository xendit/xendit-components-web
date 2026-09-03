import { lookupCardDetails } from "../../api";
import { InternalUpdateChannelComponentData } from "../../private-event-types";
import {
  AbortError,
  cancellableSleep,
  isAbortError,
  parseEncryptedFieldValue,
} from "../../utils";
import { getCardNumberFromChannelProperties } from "../../utils-channel-properties";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class CardInfoBehavior implements Behavior {
  private cardDetailsRequest: {
    cardNumber: string;
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  constructor(
    public bb: BlackboardType,
    private channelCode: string,
  ) {}

  enter() {
    this.lookupCardDetails();
  }

  updatePostorder() {
    this.lookupCardDetails();
  }

  exit() {
    this.abortLookupCardDetails();
  }

  abortLookupCardDetails() {
    if (this.cardDetailsRequest) {
      this.cardDetailsRequest.abortController.abort(new AbortError());
      this.cardDetailsRequest = null;
    }
  }

  lookupCardDetails() {
    const cardNumber = getCardNumberFromChannelProperties(
      this.bb.channelProperties,
    );
    if (!cardNumber) {
      return;
    }

    // don't look up the card number if a request is in flight for the same card number
    if (this.cardDetailsRequest?.cardNumber === cardNumber) {
      return;
    }

    // don't look up the card number if we already have the details
    if (this.bb.channelData?.cardDetails?.cardNumber === cardNumber) {
      return;
    }

    if (this.cardDetailsRequest) {
      this.abortLookupCardDetails();
    }

    const abortController = new AbortController();
    const promise = cancellableSleep(300, abortController.signal) // debounce
      .then(() => {
        if (this.bb.mock) {
          if (this.bb.sdkKey.publicKey) {
            // in mock mode, if the ciphertext is actually a base64-encoded JSON string, then use that as the mock response
            const encodedError =
              parseEncryptedFieldValue(cardNumber).cipherText;
            try {
              return JSON.parse(atob(encodedError));
            } catch {
              // not json, ignore
            }
          }

          // otherwise, return a fixed mock response
          return {
            schemes: ["VISA"],
            country_codes: ["ID"],
            require_billing_information: false,
            bin: 400000,
          };
        } else {
          const cleanedCardNumber = this.bb.sdkKey.publicKey
            ? // remove encoded validation error -
              // normally, an invalid card number would have some other stuff appended to the end, but we still want to look up the card details even if the user hasn't finished typing
              parseEncryptedFieldValue(cardNumber).withoutValidationError
            : cardNumber.replace(/\s/g, ""); // the card number is plaintext, so remove spaces

          // real card details
          return lookupCardDetails(
            this.bb.sdkKey,
            {
              card_number: cleanedCardNumber,
            },
            this.bb.sdkKey.sessionAuthKey,
            undefined,
            abortController.signal,
          );
        }
      })
      .then((response) => {
        this.bb.dispatchEvent(
          new InternalUpdateChannelComponentData(this.channelCode, {
            cardDetails: {
              cardNumber,
              details: response,
            },
            // cardBin here is what makes updateChannelComponentData fire card-bin-changed
            ...(response?.bin ? { cardBin: response.bin } : {}),
          }),
        );
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        throw error;
      });

    this.cardDetailsRequest = {
      cardNumber,
      promise,
      abortController,
    };
  }
}
