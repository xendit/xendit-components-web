import { lookupCardDetails } from "../../api";
import { InternalUpdateWorldState } from "../../private-event-types";
import {
  AbortError,
  cancellableSleep,
  getCardNunberFromChannelProperties,
  isAbortError,
} from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class CardInfoBehavior implements Behavior {
  private cardDetailsRequest: {
    cardNumber: string;
    promise: Promise<void>;
    abortController: AbortController;
  } | null = null;

  constructor(public bb: BlackboardType) {}

  enter() {
    this.lookupCardDetails();
  }

  update() {
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
    const cardNumber = getCardNunberFromChannelProperties(
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
    if (this.bb.world?.cardDetails?.cardNumber === cardNumber) {
      return;
    }

    if (this.cardDetailsRequest) {
      this.abortLookupCardDetails();
    }

    const abortController = new AbortController();
    const promise = cancellableSleep(300, abortController.signal) // debounce
      .then(() => {
        if (this.bb.mock) {
          // mock card details
          return {
            schemes: ["VISA"],
            country_codes: ["US"],
            require_billing_information: true,
          };
        } else {
          // real card details
          return lookupCardDetails(
            this.bb.sdkKey,
            {
              card_number: cardNumber,
            },
            this.bb.sdkKey.sessionAuthKey,
            undefined,
            abortController.signal,
          );
        }
      })
      .then((response) => {
        this.bb.dispatchEvent(
          new InternalUpdateWorldState({
            cardDetails: {
              cardNumber,
              details: response,
            },
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
