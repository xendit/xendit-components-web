import { internal } from "./internal";
import { XenditComponents } from "./public-sdk";
import { randomUUID, telemetryHostFromHostId } from "./utils";

export interface SessionTelemetryEvent {
  stage:
    | "PAYMENT_SESSION_CREATED" // sent by backend
    | "CHECKOUT_PAGE_VIEW" // on sdk init
    | "METHOD_SELECTED" // on current channel change
    | "FORM_INPUTTED" // first time any field is changed
    | "ATTEMPT_CREATED" // on pr/pt created
    | "ACTION_TAKEN" // on action end
    | "REDIRECTED_BACK_TO_OUR_HOSTED" // on resume
    | "REDIRECT_TO_MERCHANT" // on session terminal state
    | "SUCCESS_PAYMENT"; // sent by backend
  success: boolean;
  payment_channel?: string;
  payment_request_id?: string;
  payment_token_id?: string;
  metadata?: object;
}

interface SessionTelemetryEventWithExtras extends SessionTelemetryEvent {
  timestamp_micros: string;
  event_id: string;
  parent_event_id: string | null;
}

export type SessionTelemetryScope = {
  id: string | null;
  parentScope: SessionTelemetryScope | null;
};

const TELEMETRY_INTERVAL = 2000;

export class SessionTelemetry {
  queue: SessionTelemetryEventWithExtras[] = [];
  scope: SessionTelemetryScope = {
    id: null,
    parentScope: null,
  };

  timeout: number | null = 0;
  visibilityChangeHandler: (() => void) | null = null;

  constructor(private sdk: XenditComponents) {}

  /**
   * Send an event, make it the parent of future events
   */
  appendAndPushScope(event: SessionTelemetryEvent) {
    const id = this.append(event);
    this.scope = {
      id,
      parentScope: this.scope,
    };
    console.log("add scope", this.scope.id);
    return this.scope;
  }

  /**
   * Remove the provided scope and all its decendants from the scope stack
   */
  popScope(scope: SessionTelemetryScope) {
    if (scope.parentScope) {
      console.log("remove scope", this.scope.id);
      this.scope = scope.parentScope;
      console.log("new top scope", this.scope.id);
    }
  }

  /**
   * Send an event
   */
  append(event: SessionTelemetryEvent): string {
    console.log(event);
    const eventId = randomUUID();
    this.queue.push({
      ...event,
      timestamp_micros: `${Date.now() * 1000}`,
      event_id: eventId,
      parent_event_id: this.scope.id,
    });
    this.scheduleSend();
    return eventId;
  }

  private scheduleSend() {
    if (!this.timeout) {
      this.timeout = window.setTimeout(() => {
        this.end();
      }, TELEMETRY_INTERVAL);
    }

    if (!this.visibilityChangeHandler) {
      this.visibilityChangeHandler = () => {
        if (document.visibilityState === "hidden") {
          this.end();
        }
      };
      document.addEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
    }
  }

  end() {
    if (!this.queue.length) return;

    const sdkKey = this.sdk[internal].sdkKey;
    const host = telemetryHostFromHostId(sdkKey.hostId);
    const sessionId = this.sdk[internal].worldState?.session.payment_session_id;
    if (host && sessionId) {
      const url = new URL("/v1/sessions/performance", host);
      navigator.sendBeacon(
        url,
        JSON.stringify({
          payment_session_id: sessionId,
          session_auth_id: sdkKey.sessionAuthKey,
          events: this.queue,
        }),
      );
      this.queue = [];
    } else {
      // in mock mode, just let the events queue forever so we can see them in the debugger
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}
