import { createElement } from "preact";
import { ActionDeepLink } from "../../components/action-deep-link";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";

/**
 * An empty list of actions means the user has to take some action on their own, like tapping a push notification.
 */
export class ActionDeepLinkBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private actionIndex: string,
  ) {
    super(bb);
  }

  enter() {
    assert(this.bb.world);

    const deepLinkAction =
      this.bb.world?.paymentEntity?.entity.actions[Number(this.actionIndex)];
    assertEquals(deepLinkAction?.type, "REDIRECT_CUSTOMER");

    if (
      deepLinkAction.descriptor !== "DEEPLINK_URL" &&
      deepLinkAction.descriptor !== "WEB_URL"
    ) {
      // The deeplink popup can also handle regular web urls (if paylinks are enabled, that's useful to prevent auto-redirects)
      throw new Error("Unexpected action type in ActionDeepLinkBehavior");
    }

    const t = this.bb.sdk.t.bind(this.bb.sdk);
    const channel = this.bb.channel;
    assert(channel);

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() => {
      return createElement(ActionDeepLink, {
        t,
        channel,
        redirectUrl: deepLinkAction.value,
      });
    });
  }

  exit() {
    super.exit();
  }
}
