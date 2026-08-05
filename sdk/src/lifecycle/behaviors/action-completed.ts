import { internal } from "../../internal";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ActionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.sdk[internal].telemetry.append({
      stage: "ACTION_TAKEN",
      success: true,
      payment_channel: this.bb.channel?.channel_code ?? "",
    });
  }
}
