import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class PaymentEntityFailedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.submissionRequested = false;
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }
}
