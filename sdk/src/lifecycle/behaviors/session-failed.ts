import { XenditSessionExpiredOrCanceledEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";
import { TelemetryEvents } from "../../telemetry-events";

export class SessionFailedBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    // EXPIRED or CANCELED (the session itself is still ACTIVE when the TTL ran out on the client)
    private status: string,
  ) {}

  enter() {
    if (this.bb.world?.session.status === "ACTIVE") {
      // the TTL ran out on the client, keep it expired even if the device clock is set back
      this.bb.sessionRecvTime = 0;
    }

    this.bb.dispatchEvent(new XenditSessionExpiredOrCanceledEvent());

    this.bb.telemetry.append(
      TelemetryEvents.End(false, this.status, this.bb.sessionUpdateSummary),
    );
  }
}
