import { Behavior, SdkData } from "../behavior-tree-runner";

export class SdkLoadingBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    // do nothing
  }
}

export class SdkActiveBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    this.data.sdkEvents.setInitialized();
  }
}

export class SdkFatalErrorBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    // TODO: emit fatal error event
  }
}
