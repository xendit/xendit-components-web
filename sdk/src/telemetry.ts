import { internal } from "./internal";
import { XenditComponents } from "./public-sdk";
import { SessionTelemetryEvent } from "./telemetry-events";
import { randomUUID, SLEEP_MULTIPLIER, telemetryHostFromHostId } from "./utils";

/**
 * Convenience method to get telemetry
 */
export function getTelemetry(sdk: XenditComponents) {
  return sdk[internal].telemetry;
}

export interface SessionTelemetryEventWithExtras extends SessionTelemetryEvent {
  timestamp_micros: string;
  event_id: string;
  parent_event_id?: string;
}

export type SessionTelemetryScope = {
  id: string | null;
  fromEvent: string;
  parentScope: SessionTelemetryScope | null;
  inheritedProperties: {
    parent_event_id?: string;
    payment_channel?: string;
    payment_request_id?: string;
    payment_token_id?: string;
  };
};

const TELEMETRY_INTERVAL = 2000;

export class SessionTelemetry extends EventTarget {
  queue: SessionTelemetryEventWithExtras[] = [];

  rootScope: SessionTelemetryScope = {
    id: null,
    fromEvent: "ROOT",
    parentScope: null,
    inheritedProperties: {},
  };
  scope = this.rootScope;

  timeout: number | null = 0;
  beforeUnloadHandler: (() => void) | null = null;
  visibilityChangeHandler: (() => void) | null = null;

  constructor(private sdk: XenditComponents) {
    super();
  }

  /**
   * Send an event, make it the parent of future events
   */
  appendAndPushScope(event: SessionTelemetryEvent) {
    const id = this.append(event);
    this.scope = {
      id,
      fromEvent: event.stage,
      parentScope: this.scope,
      inheritedProperties: {
        ...this.scope.inheritedProperties,
        ...{ parent_event_id: id },
        ...(event.payment_channel
          ? { payment_channel: event.payment_channel }
          : undefined),
        ...(event.payment_request_id
          ? { payment_request_id: event.payment_request_id }
          : undefined),
        ...(event.payment_token_id
          ? { payment_token_id: event.payment_token_id }
          : undefined),
      },
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
      event_id: eventId,
      timestamp_micros: `${Date.now() * 1000}`,
      ...this.scope.inheritedProperties,
      ...event,
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
      }, TELEMETRY_INTERVAL * SLEEP_MULTIPLIER);
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
    const sdkKey = this.sdk[internal].sdkKey;
    const host = telemetryHostFromHostId(sdkKey.hostId);
    const sessionId = this.sdk[internal].worldState?.session.payment_session_id;
    if (host && sessionId) {
      // in live mode, send a beacon request
      if (this.queue.length) {
        const url = new URL("/v1/sessions/performance", host);
        navigator.sendBeacon(
          url,
          JSON.stringify({
            payment_session_id: sessionId,
            session_auth_id: sdkKey.sessionAuthKey,
            events: this.queue,
          }),
        );
      }
      this.queue = [];
    } else {
      // in mock mode, just let them sit in the queue so the debugger and tests can see them
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.dispatchEvent(
      new CustomEvent<SessionTelemetryEventWithExtras>("events-flushed"),
    );
  }

  testGetNextEvent() {
    return this.queue.shift() ?? null;
  }
}
