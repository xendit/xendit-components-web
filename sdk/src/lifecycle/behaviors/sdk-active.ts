import { InternalNeedsRerenderEvent } from "../../private-event-types";
import { XenditInitEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SdkActiveBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(new XenditInitEvent());

    // Schedule rerender (components don't render anything if the sdk state is not active)
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }

  exit() {
    this.bb.dispatchEvent(new InternalNeedsRerenderEvent());
  }
}
