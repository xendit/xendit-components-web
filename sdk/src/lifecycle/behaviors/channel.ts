import { Behavior, SdkData } from "../behavior-tree-runner";

export class ChannelValidBehavior implements Behavior {
  constructor(private data: SdkData) {}

  enter() {
    this.data.sdkEvents.setReady(true);
  }

  exit() {
    this.data.sdkEvents.setReady(false);
  }
}

/**
 * If this exists, submission is blocked.
 */
export class ChannelInvalidBehavior implements Behavior {
  constructor(
    private data: SdkData,
    private channelCode: string | null,
  ) {}

  enter() {}
}
