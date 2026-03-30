import { createElement } from "preact";
import { internal } from "../../internal";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior, DefaultActionContainerType } from "./action";
import { ActionQr } from "../../components/action-qr";
import { InternalBehaviorTreeUpdateEvent } from "../../private-event-types";
import { emvcoQrParse } from "../../emvco-qr";
import { EmvcoQrData } from "../../data/emvco-qr-schema";
import { hasCustomQrArt } from "../../components/action-qr-custom-art";

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
    assert(this.bb.world.paymentEntity);

    let parsedQr: EmvcoQrData | null = null;
    try {
      parsedQr = emvcoQrParse(qrAction.value);
    } catch {
      // if we can't parse it, that's ok
    }

    // in mock mode, we lie about what's inside the qr code so we can trigger custom art,
    // the channel property mock_emvco_qr_field_26_00 controls this behavior
    if (
      this.bb.mock &&
      typeof this.bb.channelProperties?.mock_emvco_qr_field_26_00 === "string"
    ) {
      const field_26_00 = this.bb.channelProperties.mock_emvco_qr_field_26_00;
      parsedQr = {
        merchantAccountInformation: {
          [field_26_00]: {
            globallyUniqueIdentifier: field_26_00,
          },
        },
      };
    }

    const qrHasCustomArt = hasCustomQrArt(parsedQr);

    const container = this.bb.sdk[internal].liveComponents.actionContainer;

    const actionQrProps: Parameters<typeof ActionQr>[0] = {
      amount: this.bb.world.session.amount,
      businessName: this.bb.world.business.name ?? "",
      channelName: this.bb.channel.brand_name,
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      hideUi: container?.getAttribute("data-qr-code-only") === "true" || false,
      onAffirm: this.affirmPayment.bind(this),
      qrString: qrAction.value,
      parsedQr,
      title: qrAction.action_subtitle,
      t: this.bb.sdk.t.bind(this.bb.sdk),
    };

    const defaultActionContainerType = qrHasCustomArt
      ? DefaultActionContainerType.QrWithCustomArt
      : DefaultActionContainerType.Generic;
    this.cleanupFn = this.ensureHasActionContainer(defaultActionContainerType);
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
