import {
  InternalBehaviorTreeUpdateEvent,
  InternalNeedsRerenderEvent,
} from "../../private-event-types";
import { SessionTelemetryScope } from "../../telemetry";
import { TelemetryEvents } from "../../telemetry-events";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { sessionExpiryTime } from "./utils/session-expiry-time";
import { setTimeoutLong } from "./utils/set-timeout-long";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  lastTelemetryKey: string | null = null;
  currentChannelTelemetryScope: SessionTelemetryScope | null = null;

  beforeUnloadHandler: EventListener | null = null;

  cancelExpiryTimeout: (() => void) | null = null;
  // the expiry time the timeout was set for
  timedExpiryTime: number | null = null;

  enter() {
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      // send abandon telemetry event when user leaves the page while in active state
      // (but not if we initiated the redirect)
      if (!this.bb.telemetry.expectingRedirectAway) {
        this.bb.telemetry.append(TelemetryEvents.Abandon(false));
      }
      // we don't need to flush, the visibilitychange event always fires after beforeunload, and it will flush
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    // telemetry
    this.telemetryForActiveChannel();

    // Schedule rerender (reveals hidden components now that session is active)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());

    // wake the behavior tree when the TTL runs out
    this.syncExpiryTimeout();
  }

  updatePreorder() {
    // telemetry - needed on update because this node doesn't change when the current channel changes
    this.telemetryForActiveChannel();

    // the server may have sent the session again with a new TTL
    this.syncExpiryTimeout();
  }

  exit() {
    // stop waiting, the session is no longer active
    this.cancelExpiryTimeout?.();

    // stop listening to abandon behavior
    window.removeEventListener("beforeunload", this.beforeUnloadHandler!);

    // telemetry
    this.telemetryForActiveChannel();

    // Schedule rerender (hides components now that session is inactive)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  /**
   * Wakes the behavior tree up when the TTL runs out, the tree decides whether the session has expired.
   */
  syncExpiryTimeout() {
    const expiryTime = sessionExpiryTime(this.bb);
    if (expiryTime === this.timedExpiryTime) {
      return;
    }
    this.timedExpiryTime = expiryTime;
    this.cancelExpiryTimeout?.();
    this.cancelExpiryTimeout = null;
    if (expiryTime === null) {
      return;
    }
    this.cancelExpiryTimeout = setTimeoutLong(
      () => this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent()),
      expiryTime - Date.now(),
    );
  }

  telemetryForActiveChannel() {
    // send a telemetry event for the channel if it has changed
    const channelCode = this.bb.channel?.channel_code ?? null;
    const key = channelCode;
    if (key === this.lastTelemetryKey) {
      // it hasn't changed
      return;
    }

    // clear previous scope
    if (this.currentChannelTelemetryScope) {
      this.bb.telemetry.popScope(this.currentChannelTelemetryScope);
      this.currentChannelTelemetryScope = null;
      this.lastTelemetryKey = null;
    }

    // newly selected channel - send event
    if (channelCode) {
      this.currentChannelTelemetryScope = this.bb.telemetry.appendAndPushScope(
        TelemetryEvents.Channel(true, channelCode),
      );
      this.lastTelemetryKey = key;
    }
  }
}
