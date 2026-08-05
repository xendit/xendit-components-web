import { internal } from "../../internal";
import { SessionTelemetryScope } from "../../telemetry";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

/**
 * Send telemetry events when the current channel changes.
 */
export class ChannelTelemetryBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    private channelCode: string | null,
  ) {}

  telemetryScope: SessionTelemetryScope | null = null;

  enter() {
    if (this.channelCode) {
      this.telemetryScope = this.bb.sdk[internal].telemetry.appendAndPushScope({
        stage: "METHOD_SELECTED",
        payment_channel: this.channelCode ?? undefined,
        success: true,
      });
    }
  }

  exit() {
    if (this.telemetryScope) {
      this.bb.sdk[internal].telemetry.popScope(this.telemetryScope);
      this.telemetryScope = null;
    }
  }
}
