import { InternalNeedsRerenderEvent } from "../../private-event-types";
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
