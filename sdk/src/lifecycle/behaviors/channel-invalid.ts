import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

/**
 * If this exists, submission is blocked.
 */
export class ChannelInvalidBehavior implements Behavior {
  constructor(
    private bb: BlackboardType,
    private channelCode: string | null,
  ) {}

  enter() {}
}
