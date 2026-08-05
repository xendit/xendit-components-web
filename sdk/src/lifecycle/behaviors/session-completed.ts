import { internal } from "../../internal";
import { XenditSessionCompleteEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SessionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(
      new XenditSessionCompleteEvent(
        this.bb.world?.succeededChannel?.channel_code || null,
      ),
    );

    this.bb.sdk[internal].telemetry.append({
      stage: "REDIRECT_TO_MERCHANT",
      success: true,
    });
  }
}
