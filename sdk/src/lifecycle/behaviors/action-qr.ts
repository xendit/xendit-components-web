import { createElement } from "preact";
import { internal } from "../../internal";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";
import { ActionQr } from "../../components/action-qr";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";

export class ActionQrBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private actionIndex: string,
  ) {
    super(bb);
  }

  enter() {
    const qrAction =
      this.bb.world?.paymentEntity?.entity.actions[Number(this.actionIndex)];

    assertEquals(qrAction?.type, "PRESENT_TO_CUSTOMER");
    assert(this.bb.world);
    assert(this.bb.channel);

    const container = this.bb.sdk[internal].liveComponents.actionContainer;

    const actionQrProps = {
      amount: this.bb.world.session.amount,
      businessName: this.bb.world.business.name ?? "",
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      hideUi: container?.getAttribute("data-qr-code-only") === "true" || false,
      onAffirm: this.affirmPayment.bind(this),
      qrString: qrAction.value,
      title: qrAction.action_subtitle,
      t: this.bb.sdk.t.bind(this.bb.sdk),
    };

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() => createElement(ActionQr, actionQrProps));
  }

  /**
   * Fired when user affirms they have made the payment by clicking
   * the affirm button.
   */
  affirmPayment() {
    if (this.bb.sdk.isProdLive()) {
      // live mode
      this.bb.pollImmediatelyRequested = true;
    } else {
      this.bb.simulatePaymentRequested = true;
    }
    this.bb.dispatchEvent(new InternalBehaviorTreeUpdateEvent());
  }

  exit() {
    super.exit();
  }
}
