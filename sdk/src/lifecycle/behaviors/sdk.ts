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
