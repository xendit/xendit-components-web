import { InternalNeedsRerenderEvent } from "../../private-event-types";
import { SessionTelemetryScope } from "../../telemetry";
import { TelemetryEvents } from "../../telemetry-events";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { BffSession } from "../../backend-types/session";
import { expireSessionLocally } from "./utils/expire-session-locally";
import { SessionExpiryTimer } from "./utils/session-expiry-timer";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  lastTelemetryKey: string | null = null;
  currentChannelTelemetryScope: SessionTelemetryScope | null = null;

  beforeUnloadHandler: EventListener | null = null;

  expiryTimer = new SessionExpiryTimer(() => this.expireIfDue());
  // the session object the timer was started from, a new object means the server sent a new TTL
  timedSession: BffSession | null = null;

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

    // count down the session's TTL
    this.syncExpiryTimer();
    this.expireIfDue();
  }

  updatePreorder() {
    // telemetry - needed on update because this node doesn't change when the current channel changes
    this.telemetryForActiveChannel();

    // a new session from the server restarts the countdown, an elapsed TTL becomes due once the submission ends
    this.syncExpiryTimer();
    this.expireIfDue();
  }

  exit() {
    // stop counting down, the session is no longer active
    this.expiryTimer.stop();

    // stop listening to abandon behavior
    window.removeEventListener("beforeunload", this.beforeUnloadHandler!);

    // telemetry
    this.telemetryForActiveChannel();

    // Schedule rerender (hides components now that session is inactive)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  /**
   * Restarts the countdown when a new session object arrives.
   * World state updates that don't carry a session keep the same object, so they don't restart it.
   */
  syncExpiryTimer() {
    const session = this.bb.world?.session ?? null;
    if (session === this.timedSession) {
      return;
    }
    this.timedSession = session;
    this.expiryTimer.start(session?.expires_ttl);
  }

  /**
   * Treats the session as expired once its TTL has run out, but only while no submission is in progress.
   * During a submission the server decides.
   */
  expireIfDue() {
    if (
      this.expiryTimer.hasElapsed() &&
      this.bb.submissionRequested === false &&
      this.bb.world?.session.status === "ACTIVE"
    ) {
      expireSessionLocally(this.bb);
    }
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
