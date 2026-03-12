import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ActionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}
  enter() {}
}
