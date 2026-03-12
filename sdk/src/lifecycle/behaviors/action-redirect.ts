import { XenditWillRedirectEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    private url: string,
  ) {}

  enter() {
    this.bb.dispatchEvent(new XenditWillRedirectEvent());
    window.location.href = this.url;
  }
}
