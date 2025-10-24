import { BffAction } from "../../backend-types/payment-entity";
import { Behavior, SdkData } from "../behavior-tree-runner";

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private action: BffAction,
  ) {}

  enter() {
    this.data.sdkEvents.setWillRedirect();
    window.location.href = this.action.value;
  }
}

export class ActionIframeBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private action: BffAction,
  ) {}

  enter() {
    // TODO: create action container and load iframe with action.value
  }
}
