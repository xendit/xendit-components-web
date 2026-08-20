import { createElement } from "preact";
import { ActionBarcode } from "../../components/action-barcode";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";
import { ActionCardProps } from "../../components/action-card";
import { internal } from "../../internal";

export class ActionBarcodeBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private actionIndex: string,
  ) {
    super(bb);
  }

  enter() {
    const barcodeAction =
      this.bb.world?.paymentEntity?.entity.actions[Number(this.actionIndex)];

    assertEquals(barcodeAction?.type, "PRESENT_TO_CUSTOMER");
    assert(this.bb.world);
    assert(this.bb.channel);

    const actionBarcodeProps = {
      amount: this.bb.world.session.amount,
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      onAffirm: this.affirmPayment.bind(this),
      barcodeContent: barcodeAction.value,
      merchantName: this.bb.world.business.name ?? "",
      paymentCode: barcodeAction.value,
      instructions: barcodeAction.instructions ?? [],
      title: barcodeAction.action_title,
      t: this.bb.sdk.t.bind(this.bb.sdk),
    };

    const container = this.bb.sdk[internal].liveComponents.actionContainer;

    let cardProps: Omit<ActionCardProps, "children"> | undefined = undefined;
    const withCard = container?.getAttribute("data-with-card") === "true";
    if (withCard) {
      cardProps = {
        actionIconSrc: barcodeAction.action_graphic,
        actionText: barcodeAction.action_subtitle,
        channelBrandLogoUrl: this.bb.channel.brand_logo_url,
        channelBrandName: this.bb.channel.brand_name,
        color: this.bb.channel.brand_color,
        title: barcodeAction.action_title,
      };
    }

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(
      () => createElement(ActionBarcode, actionBarcodeProps),
      cardProps,
    );
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
}
