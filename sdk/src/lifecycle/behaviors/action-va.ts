import { createElement } from "preact";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";
import { ActionVa } from "../../components/action-va";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";

export class ActionVaBehavior extends ContainerActionBehavior {
  constructor(
    protected bb: BlackboardType,
    private actionIndex: string,
  ) {
    super(bb);
  }

  enter() {
    const vaAction =
      this.bb.world?.paymentEntity?.entity.actions[Number(this.actionIndex)];

    assertEquals(vaAction?.type, "PRESENT_TO_CUSTOMER");
    assert(this.bb.world);
    assert(this.bb.channel);

    const actionVaProps = {
      amount: this.bb.world.session.amount,
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      onAffirm: this.affirmPayment.bind(this),
      vaNumber: vaAction.value,
      merchantName: this.bb.world.business.name ?? "",
      instructions: vaAction.instructions ?? [],
      title: vaAction.action_title,
      t: this.bb.sdk.t.bind(this.bb.sdk),
      telemetry: this.bb.telemetry,
    };

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(() => createElement(ActionVa, actionVaProps));
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
