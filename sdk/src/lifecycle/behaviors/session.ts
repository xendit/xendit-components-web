import { InternalNeedsRerenderEvent } from "../../private-event-types";
import {
  XenditSessionCompleteEvent,
  XenditSessionExpiredOrCanceledEvent,
} from "../../public-event-types";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SessionActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    // Schedule rerender (components don't render anything if the session state is not active)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  exit() {
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }
}

export class SessionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditSessionCompleteEvent());
  }
}

export class SessionFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    assert(this.bb.world?.session);
    this.bb.dispatchEvent(new XenditSessionExpiredOrCanceledEvent());
  }
}
