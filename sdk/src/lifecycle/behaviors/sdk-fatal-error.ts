import { XenditFatalErrorEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

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
