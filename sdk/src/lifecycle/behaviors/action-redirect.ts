import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { XenditWillRedirectEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    private url: string,
  ) {}

  // Fires when the page returns from bfcache
  private onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;

    // let the next poll result decide whether this payment was abandoned
    this.bb.redirectReturnPending = true;
    this.bb.pollImmediatelyRequested = true;

    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  };

  enter() {
    window.addEventListener("pageshow", this.onPageShow);
    this.bb.dispatchEvent(new XenditWillRedirectEvent(this.url));
    window.location.href = this.url;
  }

  exit() {
    window.removeEventListener("pageshow", this.onPageShow);
  }
}
