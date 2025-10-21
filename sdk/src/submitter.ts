import { createElement, render } from "preact";
import { ChannelProperties } from "./backend-types/channel";
import { XenditActionBeginEvent } from "./public-event-types";
import { XenditSessionSdk } from "./public-sdk";
import { ActionHandler } from "./components/action-handler";
import { BffSession } from "./backend-types/session";
import {
  BffAction,
  BffPaymentRequest,
  BffPaymentToken,
} from "./backend-types/payment-entity";
import { makeTestPaymentRequest } from "./test-data";
import { pickAction } from "./utils";

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
        paymentRequest: BffPaymentRequest;
      }
    | {
        type: "token";
        paymentToken: BffPaymentToken;
      }
    | null = null;

  private actionHandlerElement: HTMLElement | null = null;

  constructor(
    sdk: XenditSessionSdk,
    session: BffSession,
    channelCode: string,
    channelProperties: ChannelProperties,
    isTest: boolean,
    onDone: DoneCallback,
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
            paymentRequest: makeTestPaymentRequest(
              this.session,
              this.channelCode,
              this.channelProperties,
            ),
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

  pollStatus = () => {
    if (this.isTest) {
      switch (this.paymentEntity?.type) {
        case "request":
          this.paymentEntity.paymentRequest.actions = [];
          this.paymentEntity.paymentRequest.status = "SUCCEEDED";
          break;
        case "token":
          this.paymentEntity.paymentToken.actions = [];
          this.paymentEntity.paymentToken.status = "ACTIVE";
          break;
      }
      this.handlePrPtByStatus();
    } else {
      // TODO
      throw new Error("Not implemented.");
    }
  };

  cancel = () => {
    this.cleanup();
    // TODO
  };

  cleanup = () => {
    if (this.actionHandlerElement) {
      this.actionHandlerElement.remove();
      this.actionHandlerElement = null;
    }
    this.paymentEntity = null;
  };

  private getPrOrPt(): BffPaymentRequest | BffPaymentToken {
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
      case "REQUIRES_ACTION": {
        this.sdk.dispatchEvent(new XenditActionBeginEvent());
        const action = pickAction(prOrPt.actions);
        switch (action.type) {
          case "PRESENT_TO_CUSTOMER":
          case "REDIRECT_CUSTOMER":
            this.actionHandlerElement =
              this.createModalActionHandlerComponent(action);
            document.body.appendChild(this.actionHandlerElement);
            break;
          case "API_POST_REQUEST":
            throw new Error(
              `Not implemented: ${action.type} ${action.descriptor}`,
            );
            break;
        }
        throw new Error(`Unknown action type: ${action.type}`);
        break;
      }
      case "AUTHORIZED":
      case "SUCCEEDED":
      case "ACTIVE": {
        this.cleanup();
        this.onDone();
        break;
      }
      case "CANCELED":
      case "EXPIRED":
      case "FAILED": {
        this.cleanup();
        this.onDone(new Error(`Payment ${prOrPt.status}`));
        break;
      }
      default: {
        throw new Error(`Unknown payment request status: ${prOrPt.status}`);
      }
    }
  }

  private createModalActionHandlerComponent(action: BffAction) {
    if (!this.paymentEntity) {
      throw new Error("Payment request or token not created yet");
    }

    const container = document.createElement("xendit-action-handler");

    render(
      createElement(ActionHandler, {
        paymentEntity: this.paymentEntity,
        isTest: this.isTest,
        channelProperties: this.channelProperties,
        action,
        triggerPoll: this.pollStatus,
        onCancel: this.cancel,
      }),
      container,
    );

    return container;
  }
}

export default Submitter;
