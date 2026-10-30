import {
  InternalBehaviorTreeUpdateEvent,
  InternalNeedsRerenderEvent,
} from "../../private-event-types";
import {
  XenditCurrentChannelChangedEvent,
  XenditWillSavePaymentMethodEvent,
} from "../../public-event-types";
import { SessionTelemetryScope } from "../../telemetry";
import { TelemetryEvents } from "../../telemetry-events";
import { assert, willSavePaymentMethod } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { sessionExpiryTime } from "./utils/session-expiry-time";
import { setTimeoutLong } from "./utils/set-timeout-long";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  lastTelemetryKey: string | null = null;
  currentChannelTelemetryScope: SessionTelemetryScope | null = null;

  lastChannelCode: string | null = null;
  lastWillSavePaymentMethod = false;

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
        this.bb.telemetry.flush();
      }
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    // telemetry
    this.telemetryForActiveChannel();
    this.dispatchCurrentChannelChanged();
    this.dispatchWillSavePaymentMethod();

    // Schedule rerender (reveals hidden components now that session is active)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());

    // wake the behavior tree when the TTL runs out
    this.syncExpiryTimeout();
  }

  updatePreorder() {
    // telemetry - needed on update because this node doesn't change when the current channel changes
    this.telemetryForActiveChannel();
    this.dispatchCurrentChannelChanged();
    this.dispatchWillSavePaymentMethod();

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

  dispatchCurrentChannelChanged() {
    // send the current-channel-changed event if it has changed
    const channelCode = this.bb.currentChannelCode;
    if (channelCode === this.lastChannelCode) {
      return;
    }
    this.lastChannelCode = channelCode;
    this.bb.dispatchEvent(new XenditCurrentChannelChangedEvent(channelCode));
  }

  dispatchWillSavePaymentMethod() {
    // send the will-save-payment-method event if it has changed
    assert(this.bb.world?.session);
    const value = willSavePaymentMethod(
      this.bb.world.session,
      this.bb.channel,
      this.bb.channelData?.savePaymentMethod ?? false,
    );
    if (value === this.lastWillSavePaymentMethod) {
      return;
    }
    this.lastWillSavePaymentMethod = value;
    this.bb.dispatchEvent(new XenditWillSavePaymentMethodEvent(value));
  }
}
