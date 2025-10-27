import { BffSessionStatus } from "./backend-types/session";
import { InternalUpdateWorldState } from "./private-event-types";
import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
  XenditNotReadyEvent,
  XenditReadyEvent,
  XenditSessionCompleteEvent,
  XenditSessionFailedEvent,
  XenditWillRedirectEvent,
} from "./public-event-types";
import { WorldState, XenditSessionSdk } from "./public-sdk";

export class SdkEventManager {
  sdk: XenditSessionSdk;

  ready = false;
  action = false;

  constructor(sdk: XenditSessionSdk) {
    this.sdk = sdk;
  }

  updateWorld(data: Partial<WorldState>) {
    this.sdk.dispatchEvent(new InternalUpdateWorldState(data));
  }

  setReady(ready: boolean) {
    if (this.ready === ready) return;
    this.ready = ready;

    if (ready) {
      this.sdk.dispatchEvent(new XenditReadyEvent());
    } else {
      this.sdk.dispatchEvent(new XenditNotReadyEvent());
    }
  }

  setHasAction(action: boolean) {
    if (this.action === action) return;
    this.action = action;

    if (action) {
      this.sdk.dispatchEvent(new XenditActionBeginEvent());
    } else {
      this.sdk.dispatchEvent(new XenditActionEndEvent());
    }
  }

  setSessionState(state: BffSessionStatus) {
    if (state === "COMPLETED") {
      this.sdk.dispatchEvent(new XenditSessionCompleteEvent());
    } else {
      this.sdk.dispatchEvent(new XenditSessionFailedEvent());
    }
  }

  setWillRedirect() {
    this.sdk.dispatchEvent(new XenditWillRedirectEvent());
  }
}
