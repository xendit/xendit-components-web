import { createElement } from "preact";
import { assert } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";
import { ActionEmptyListPushNotification } from "../../components/action-empty-list-push-notification";
import { InternalScheduleMockUpdateEvent } from "../../private-event-types";
import { makeTestPollResponse } from "../../data/test-data-modifiers";

/**
 * An empty list of actions means the user has to take some action on their own, like tapping a push notification.
 */
export class ActionEmptyListPushNotificationBehavior extends ContainerActionBehavior {
  constructor(protected bb: BlackboardType) {
    super(bb);
  }

  enter() {
    assert(this.bb.world);

    // Keep this behavior alive even if the payment entity status changes to pending.
    // Normally, the status would change to pending almost immediently and the action would be closed.
    // This helps keep it open until the user pays.
    this.bb.hackyOvoActionLatch = true;

    const t = this.bb.sdk.t.bind(this.bb.sdk);
    const channel = this.bb.channel;
    assert(channel);

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() => {
      return createElement(ActionEmptyListPushNotification, {
        t,
        channel,
      });
    });

    if (this.bb.mock) {
      this.bb.dispatchEvent(
        new InternalScheduleMockUpdateEvent(
          makeTestPollResponse(
            this.bb.world,
            this.bb.channel,
            "PENDING_PAYMENT_ENTITY_ONLY",
          ),
        ),
      );
    }
  }

  exit() {
    this.bb.hackyOvoActionLatch = undefined;
    super.exit();
  }
}
