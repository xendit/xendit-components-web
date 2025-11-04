import { createElement, render } from "preact";
import { BffSessionStatus } from "./backend-types/session";
import { internal } from "./internal";
import {
  InternalHasInFlightRequestEvent,
  InternalUpdateWorldState,
} from "./private-event-types";
import {
  XenditActionBeginEvent,
  XenditActionEndEvent,
  XenditInitEvent,
  XenditNotReadyEvent,
  XenditReadyEvent,
  XenditSessionCompleteEvent,
  XenditSessionFailedEvent,
  XenditSubmissionBeginEvent,
  XenditSubmissionEndEvent,
  XenditWillRedirectEvent,
} from "./public-event-types";
import { UpdatableWorldState, XenditSessionSdk } from "./public-sdk";
import { ActionIframe } from "./components/action-iframe";
import DefaultActionContainer from "./components/default-action-container";

export class SdkEventManager {
  sdk: XenditSessionSdk;

  ready = false;
  hasInFlightRequest = false;
  submitting = false;
  action = false;

  constructor(sdk: XenditSessionSdk) {
    this.sdk = sdk;
  }

  updateWorld(data: UpdatableWorldState) {
    this.sdk.dispatchEvent(new InternalUpdateWorldState(data));
  }

  setInitialized() {
    this.sdk.dispatchEvent(new XenditInitEvent());
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

  setHasInFlightSubmitRequest(hasInFlightRequest: boolean) {
    if (this.hasInFlightRequest === hasInFlightRequest) return;
    this.hasInFlightRequest = hasInFlightRequest;

    if (hasInFlightRequest) {
      this.sdk.dispatchEvent(new InternalHasInFlightRequestEvent(true));
    } else {
      this.sdk.dispatchEvent(new InternalHasInFlightRequestEvent(false));
    }
  }

  setSubmitting(submitting: boolean) {
    if (this.submitting === submitting) return;
    this.submitting = submitting;

    if (submitting) {
      this.sdk.dispatchEvent(new XenditSubmissionBeginEvent());
    } else {
      this.sdk.dispatchEvent(new XenditSubmissionEndEvent());
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

  setActionContainerLocked(locked: boolean) {
    // TODO: don't allow users to create or destroy action container when locked
  }

  /**
   * Creates a default action container if the user has not created one already.
   * Returns a cleanup function that destroys the default action container if it was created.
   */
  ensureHasActionContainer() {
    if (this.sdk[internal].liveComponents.actionContainer) {
      // user created action container already
      // TODO: validate it's in the dom and the right size
      return () => {};
    }
    const container = document.createElement("div");
    container.setAttribute("id", "xendit-default-action-container");
    render(
      createElement(DefaultActionContainer, {
        sdk: this.sdk,
        title: "Complete your action",
        onCloseClick: () => {
          this.sdk.abortSubmission();
        },
      }),
      container,
    );
    document.body.appendChild(container);
    return () => {
      render(null, container);
      container.remove();
    };
  }

  populateActionContainerWithIframe(url: string) {
    const container = this.sdk[internal].liveComponents.actionContainer;
    if (!container) {
      throw new Error(
        "Trying to populate action container, but it is missing; A default action container should have been created. This is a bug, please contact support.",
      );
    }
    render(createElement(ActionIframe, { url }), container);
  }
}
