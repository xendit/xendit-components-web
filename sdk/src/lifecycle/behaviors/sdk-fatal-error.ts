import { BffErrorContent } from "../../backend-types/common";
import { XenditFatalErrorEvent } from "../../public-event-types";
import { BlackboardType } from "../behavior-tree";
import { Behavior } from "../behavior-tree-runner";

export class SdkFatalErrorBehavior implements Behavior {
  constructor(private bb: BlackboardType) {}

  enter() {
    this.bb.dispatchEvent(
      new XenditFatalErrorEvent(
        this.bb.sdkFatalErrorMessage ?? "Unknown error",
        this.bb.sdkFatalErrorUserMessage
          ? errorContentToUserMessage(this.bb.sdkFatalErrorUserMessage)
          : undefined,
      ),
    );
  }
}

function errorContentToUserMessage(error: BffErrorContent): string[] {
  return [error.title, error.message_1, error.message_2].filter(
    (line) => line !== undefined,
  ) as string[];
}
