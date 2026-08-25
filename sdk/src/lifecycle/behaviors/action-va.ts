import { createElement } from "preact";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior } from "./action";
import { ActionVa } from "../../components/action-va";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { ActionCardProps } from "../../components/action-card";
import { internal } from "../../internal";

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

    const instructions = vaAction.instructions ?? [];

    const actionVaProps = {
      amount: this.bb.world.session.amount,
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      onAffirm: this.affirmPayment.bind(this),
      vaNumber: vaAction.value,
      merchantName: this.bb.world.business.name ?? "",
      renderInstructions: this.renderActionInstructions.bind(
        this,
        instructions ?? [],
      ),
      title: vaAction.action_title,
      t: this.bb.sdk.t.bind(this.bb.sdk),
      telemetry: this.bb.telemetry,
    };

    const container = this.bb.sdk[internal].liveComponents.actionContainer;

    let cardProps: Omit<ActionCardProps, "children"> | undefined = undefined;
    const withCard = container?.getAttribute("data-with-card") === "true";
    if (withCard) {
      cardProps = {
        actionIconSrc: vaAction.action_graphic,
        actionText: vaAction.action_subtitle,
        channelBrandLogoUrl: this.bb.channel.brand_logo_url,
        channelBrandName: this.bb.channel.brand_name,
        color: this.bb.channel.brand_color,
        title: vaAction.action_title,
      };
    }

    this.cleanupFn = this.ensureHasActionContainer();
    this.populateActionContainer(
      () => createElement(ActionVa, actionVaProps),
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
