import { InternalNeedsRerenderEvent } from "../../private-event-types";
import {
  XenditFatalErrorEvent,
  XenditInitEvent,
} from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SdkLoadingBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    // do nothing
  }
}

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

export class SdkFatalErrorBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(
      new XenditFatalErrorEvent(
        this.bb.sdkFatalErrorMessage ?? "Unknown error",
      ),
    );
  }
}
