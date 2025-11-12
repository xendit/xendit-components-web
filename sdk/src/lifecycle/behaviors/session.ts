import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {}
}

export class SessionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.sdkEvents.setSessionState("COMPLETED");
  }
}

export class SessionFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    assert(this.bb.world?.session);
    this.bb.sdkEvents.setSessionState(this.bb.world.session.status);
  }
}
