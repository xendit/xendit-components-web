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
  cleanupFn: (() => void) | null = null;

  constructor(
    private data: SdkData,
    private url: string,
  ) {}

  enter() {
    this.cleanupFn = this.data.sdkEvents.ensureHasActionContainer();
    this.data.sdkEvents.populateActionContainerWithIframe(
      this.url,
      this.data.mock,
      this.cleanupActionContainer.bind(this),
    );
  }

  cleanupActionContainer() {
    if (this.cleanupFn) {
      this.cleanupFn();
      this.cleanupFn = null;
    }
  }

  exit() {
    this.cleanupActionContainer();
  }
}
