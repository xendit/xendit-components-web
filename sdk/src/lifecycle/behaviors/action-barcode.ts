import { createElement } from "preact";
import { ActionBarcode } from "../../components/action-barcode";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";

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

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() =>
      createElement(ActionBarcode, actionBarcodeProps),
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
