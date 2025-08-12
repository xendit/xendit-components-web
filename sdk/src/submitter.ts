import { BffSession } from "./bff-types";
import { ChannelProperties } from "./forms-types";
import {
  XenditSessionCompleteEvent,
  XenditSessionFailedEvent,
  XenditUserActionRequiredEvent
} from "./public-event-types";
import { XenditSessionSdk } from "./public-sdk";
import { makeTestV3PaymentRequest } from "./test-data";
import {
  pickAction,
  V3Action,
  V3PaymentRequest,
  V3PaymentToken
} from "./v3-types";

type DoneCallback = (error?: Error) => void;

class Submitter {
  private sdk: XenditSessionSdk;

  private session: BffSession;
  private channelCode: string;
  private channelProperties: ChannelProperties;
  private isTest: boolean;
  private onDone: DoneCallback;

  private paymentEntity:
    | {
        type: "request";
        paymentRequest: V3PaymentRequest;
      }
    | {
        type: "token";
        paymentToken: V3PaymentToken;
      }
    | null = null;

  constructor(
    sdk: XenditSessionSdk,
    session: BffSession,
    channelCode: string,
    channelProperties: ChannelProperties,
    isTest: boolean,
    onDone: DoneCallback
  ) {
    this.sdk = sdk;
    this.session = session;
    this.channelCode = channelCode;
    this.channelProperties = channelProperties;
    this.isTest = isTest;
    this.onDone = onDone;
  }

  begin() {
    if (this.isTest) {
      setTimeout(() => {
        if (this.session.session_type === "PAY") {
          this.paymentEntity = {
            type: "request",
            paymentRequest: makeTestV3PaymentRequest(
              this.session,
              this.channelCode,
              this.channelProperties
            )
          };
        } else if (this.session.session_type === "SAVE") {
          // TODO
          throw new Error("Not implemented.");
        } else {
          throw new Error(`Unknown session type: ${this.session.session_type}`);
        }
        this.handlePrPtByStatus();
      });
    } else {
      // TODO
      throw new Error("Not implemented.");
    }
  }

  private getPrOrPt(): V3PaymentRequest | V3PaymentToken {
    if (this.paymentEntity) {
      switch (this.paymentEntity.type) {
        case "request":
          return this.paymentEntity.paymentRequest;
        case "token":
          return this.paymentEntity.paymentToken;
      }
    }
    throw new Error("No payment request or token created");
  }

  private handlePrPtByStatus() {
    const prOrPt = this.getPrOrPt();

    switch (prOrPt.status) {
      case "REQUIRES_ACTION":
        this.sdk.dispatchEvent(new XenditUserActionRequiredEvent());
        this.handleAction(
          prOrPt.channel_properties,
          pickAction(prOrPt.actions)
        );
        break;
      case "AUTHORIZED":
      case "SUCCEEDED":
        this.sdk.dispatchEvent(new XenditSessionCompleteEvent());
        break;
      case "CANCELED":
      case "EXPIRED":
      case "FAILED":
        this.sdk.dispatchEvent(new XenditSessionFailedEvent());
        break;
      default:
        throw new Error(`Unknown payment request status: ${prOrPt.status}`);
    }
  }

  private handleAction(channelProperties: ChannelProperties, action: V3Action) {
    switch (action.type) {
      case "PRESENT_TO_CUSTOMER":
      case "REDIRECT_CUSTOMER":
        // this.createActionHandlerComponent(action);
        break;
      case "API_POST_REQUEST":
        throw new Error(`Not implemented: ${action.type} ${action.descriptor}`);
        break;
    }
    throw new Error(`Unknown action type: ${action.type}`);
  }
}

export default Submitter;
