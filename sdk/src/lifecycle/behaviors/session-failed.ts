import { XenditSessionExpiredOrCanceledEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { TelemetryEvents } from "../../telemetry-events";
import { assert } from "../../utils";

export class SessionFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditSessionExpiredOrCanceledEvent());

    assert(this.bb.world?.session);
    this.bb.telemetry.append(
      TelemetryEvents.End(false, this.bb.world.session.status),
    );
  }
}
