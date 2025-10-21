import { BffAction } from "../../backend-types/payment-entity";
import { Behavior, SdkData } from "../behavior-tree-runner";

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private action: BffAction,
  ) {}

  enter() {
    // TODO: emit will-redirect event and perform redirect
  }
}
