import { internal } from "../../internal";
import { InternalNeedsRerenderEvent } from "../../private-event-types";
import { SessionTelemetryScope } from "../../telemetry";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  lastTelemetryKey: string | null = null;
  currentChannelTelemetryScope: SessionTelemetryScope | null = null;

  beforeUnloadHandler: EventListener | null = null;

  enter() {
    // send abandon telemetry event when user leaves the page while in active state
    // TODO: don't send this if we're executing a redirect action
    this.beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      const telemetry = this.bb.sdk[internal].telemetry;
      // the visibilitychange event always fires after beforeunload, and it will flush the events
      telemetry.append({
        stage: "CHECKOUT_ABANDON",
        success: false,
      });
    };
    window.addEventListener("beforeunload", this.beforeUnloadHandler);

    // telemetry
    this.telemetryForActiveChannel();

    // Schedule rerender (reveals hidden components now that session is active)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  updatePreorder() {
    // telemetry - needed on update because this node doesn't change when the current channel changes
    this.telemetryForActiveChannel();
  }

  exit() {
    // stop listening to abandon behavior
    window.removeEventListener("beforeunload", this.beforeUnloadHandler!);

    // telemetry
    this.telemetryForActiveChannel();

    // Schedule rerender (hides components now that session is inactive)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  telemetryForActiveChannel() {
    // send a telemetry event for the channel if it has changed
    const telemetry = this.bb.sdk[internal].telemetry;
    const channelCode = this.bb.channel?.channel_code ?? null;
    const key = channelCode;
    if (key === this.lastTelemetryKey) {
      // it hasn't changed
      return;
    }

    if (channelCode) {
      // newly selected channel - send event
      this.currentChannelTelemetryScope = telemetry.appendAndPushScope({
        stage: "CHECKOUT_CHANNEL",
        payment_channel: channelCode,
        success: true,
      });
      this.lastTelemetryKey = key;
    } else if (this.currentChannelTelemetryScope) {
      // unselected channel - clear scope
      telemetry.popScope(this.currentChannelTelemetryScope);
      this.currentChannelTelemetryScope = null;
      this.lastTelemetryKey = null;
    }
  }
}
