import { internal } from "../../internal";
import { XenditSessionExpiredOrCanceledEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SessionFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditSessionExpiredOrCanceledEvent());

    this.bb.sdk[internal].telemetry.append({
      stage: "CHECKOUT_END",
      success: false,
    });
  }
}
