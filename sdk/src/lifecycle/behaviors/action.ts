import { IframeActionCompleteEvent } from "../../../../shared/types";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class ActionCompletedBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}
  enter() {}
}

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    private url: string,
  ) {}

  enter() {
    this.bb.sdkEvents.setWillRedirect();
    window.location.href = this.url;
  }
}

export class ActionIframeBehavior implements Behavior {
  cleanupFn: ((cancelledByUser: boolean) => void) | null = null;

  constructor(
    private bb: BlackboardType,
    private url: string,
  ) {}

  enter() {
    this.cleanupFn = this.bb.sdkEvents.ensureHasActionContainer();
    this.bb.sdkEvents.populateActionContainerWithIframe(
      this.url,
      this.bb.mock,
      (event: IframeActionCompleteEvent) => {
        this.cleanupActionContainer(false);
        this.updateMocksOnIframeCompletion(event.mockStatus === "success");

        // setting actionCompleted will ensure the action UI isn't shown again
        this.bb.actionCompleted = true;
        // request immediate poll on next update
        this.bb.pollImmediatelyRequested = true;

        this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
      },
    );
  }

  updateMocksOnIframeCompletion(success: boolean) {
    if (this.bb.mock) {
      if (success) {
        this.bb.sdkEvents.scheduleMockUpdate("ACTION_SUCCESS");
      } else {
        this.bb.sdkEvents.scheduleMockUpdate("ACTION_FAILURE");
      }
    }
  }

  cleanupActionContainer(cancelledByUser: boolean) {
    if (this.cleanupFn) {
      this.cleanupFn(cancelledByUser);
      this.cleanupFn = null;
    }
  }

  exit() {
    this.cleanupActionContainer(false);
    this.bb.sdkEvents.emptyActionContainer();
  }
}
