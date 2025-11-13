import { IframeActionCompleteEvent } from "../../../../shared/types";
import { Behavior, SdkData } from "../behavior-tree-runner";

export class ActionRedirectBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private url: string,
  ) {}

  enter() {
    this.data.sdkEvents.setWillRedirect();
    window.location.href = this.url;
  }
}

export class ActionIframeBehavior implements Behavior {
  cleanupFn: ((cancelledByUser: boolean) => void) | null = null;

  constructor(
    private data: SdkData,
    private url: string,
  ) {}

  enter() {
    this.cleanupFn = this.data.sdkEvents.ensureHasActionContainer();
    this.data.sdkEvents.populateActionContainerWithIframe(
      this.url,
      this.data.mock,
      (event: IframeActionCompleteEvent) => {
        this.cleanupActionContainer(false);
        this.updateMocksOnIframeCompletion(event.mockStatus === "success");
      },
    );
  }

  updateMocksOnIframeCompletion(success: boolean) {
    if (this.data.mock) {
      if (success) {
        this.data.sdkEvents.scheduleMockUpdate("ACTION_SUCCESS");
      } else {
        this.data.sdkEvents.scheduleMockUpdate("ACTION_FAILURE");
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
  }
}
