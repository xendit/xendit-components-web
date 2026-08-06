import { internal } from "./internal";
import { XenditComponents } from "./public-sdk";
import { randomUUID, telemetryHostFromHostId } from "./utils";

export type TelemetryStage =
  | "CHECKOUT_LOADED" // on components/checkout UI init
  | "CHECKOUT_RESUME" // emitted instead of CHECKOUT_LOADED if the user was redirected back from a partner page
  | "CHECKOUT_CHANNEL_GROUP" // on channel group click (metadata: {group_name:string})
  | "CHECKOUT_CHANNEL" // on current channel change
  | "CHECKOUT_CHANNEL_FORM_INPUT" // once for each field in the form, the first time it's modified (including save payment method and customer given name) (metadata contains {field_name:string})
  | "CHECKOUT_ATTEMPT_BEGIN" // on pr/pt request sent (or validation error) (metadata: {validation_error:string})
  | "CHECKOUT_ATTEMPT" // on pr/pt response received (or error from server) (metadata: {error_code:string})
  | "CHECKOUT_ATTEMPT_DISCARD" // when an attempt fails (payment failure screen), or the user aborts an attempt (metadata: {failure_code:string,user_abort:boolean})
  | "CHECKOUT_ACTION_BEGIN" // on action screen shown
  | "CHECKOUT_ACTION_CLOSE" // when an action screen closes
  | "CHECKOUT_DIGITAL_WALLET_BEGIN" // when a user clicks a digital wallet button
  | "CHECKOUT_DIGITAL_WALLET_CLOSE" // when a digital wallet screen completes or is closed
  | "CHECKOUT_ACTION_COPY_TEXT" // when VA/OTC action text copy button is pressed (metadata: {field_name:string})
  | "CHECKOUT_END" // on session complete, expiry, or cancel state (metadata: {status:string})
  | "CHECKOUT_PENDING" // on session pending (not PR/PT pending)
  | "CHECKOUT_ABANDON" // user closed page
  | "CHECKOUT_REDIRECT_AWAY"; // after redirecting to one of the session return URLs (after the countdown) (metadata: {status:string,url:string})
export interface SessionTelemetryEvent {
  stage: TelemetryStage;
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
  fromEvent: string;
  parentScope: SessionTelemetryScope | null;
};

const TELEMETRY_INTERVAL = 2000;

export class SessionTelemetry {
  queue: SessionTelemetryEventWithExtras[] = [];

  rootScope: SessionTelemetryScope = {
    id: null,
    fromEvent: "ROOT",
    parentScope: null,
  };
  scope = this.rootScope;

  timeout: number | null = 0;
  beforeUnloadHandler: (() => void) | null = null;
  visibilityChangeHandler: (() => void) | null = null;

  constructor(private sdk: XenditComponents) {}

  /**
   * Send an event, make it the parent of future events
   */
  appendAndPushScope(event: SessionTelemetryEvent) {
    const id = this.append(event);
    this.scope = {
      id,
      fromEvent: event.stage,
      parentScope: this.scope,
    };
    return this.scope;
  }

  /**
   * Remove the provided scope and all its decendants from the scope stack
   */
  popScope(scope: SessionTelemetryScope) {
    if (!scope.parentScope) return;

    // make sure the scope is actually active
    let checkScope = this.scope;
    while (true) {
      if (checkScope === scope) break; // ok, this scope is an ancestor of the current scope
      if (checkScope.parentScope === null) return; // this scope isn't active
      checkScope = checkScope.parentScope;
    }

    // set current scope to this scope's parent
    console.log("remove scope", scope.fromEvent);
    this.scope = scope.parentScope;
  }

  /**
   * Send an event
   */
  append(event: SessionTelemetryEvent): string {
    console.log("event", { name: event.stage, event, scope: this.scope });
    const eventId = randomUUID();
    this.queue.push({
      ...event,
      timestamp_micros: `${Date.now() * 1000}`,
      event_id: eventId,
      parent_event_id: this.scope.id,
    });
    this.setup();
    return eventId;
  }

  /**
   * Install listeners to ensure the events get flushed after a while or when the page is closed or minimized.
   */
  private setup() {
    if (!this.timeout) {
      this.timeout = window.setTimeout(() => {
        this.flush();
      }, TELEMETRY_INTERVAL);
    }

    if (!this.visibilityChangeHandler) {
      this.visibilityChangeHandler = () => {
        if (document.visibilityState === "hidden") {
          this.flush();
        }
      };
      document.addEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
    }
  }

  flush() {
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
