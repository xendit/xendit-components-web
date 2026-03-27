import { createElement } from "preact";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";
import { ActionIframe } from "../../components/action-iframe";
import { IframeActionCompleteEvent } from "../../../../shared/types";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalScheduleMockUpdateEvent,
} from "../../private-event-types";
import { assert } from "../../utils";
import { makeTestPollResponse } from "../../data/test-data-modifiers";

export class ActionIframeBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private url: string,
  ) {
    super(bb);
    this.defaultContainerHeight = 600;
  }

  enter() {
    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() => {
      assert(this.bb.channel);
      return createElement(ActionIframe, {
        url: this.url,
        channelCode: this.bb.channel.channel_code,
        mock: this.bb.mock,
        onIframeComplete: (event: IframeActionCompleteEvent) => {
          this.cleanupActionContainer(false);

          const mockResult =
            event.mockStatus === "success" ? "SUCCESS" : "FAILURE";
          this.updateMocksOnIframeCompletion(mockResult);

          // setting actionCompleted will ensure the action UI isn't shown again
          this.bb.actionCompleted = true;
          // request immediate poll on next update
          this.bb.pollImmediatelyRequested = true;

          this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
        },
      });
    });
  }

  updateMocksOnIframeCompletion(result: "SUCCESS" | "FAILURE") {
    assert(this.bb.world?.paymentEntity);
    if (this.bb.mock) {
      this.bb.dispatchEvent(
        new InternalScheduleMockUpdateEvent(
          makeTestPollResponse(this.bb.world, this.bb.channel, result),
        ),
      );
    }
  }

  exit() {
    super.exit();
  }
}
