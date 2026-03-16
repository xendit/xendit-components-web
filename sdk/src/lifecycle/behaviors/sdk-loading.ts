import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SdkLoadingBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    // do nothing
  }
}
