import { XenditSessionCompleteEvent } from "../../public-event-types";
import { TelemetryEvents } from "../../telemetry-events";
import { assert } from "../../utils";
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

    assert(this.bb.world?.session);
    this.bb.telemetry.append(
      TelemetryEvents.End(true, this.bb.world.session.status),
    );
  }
}
