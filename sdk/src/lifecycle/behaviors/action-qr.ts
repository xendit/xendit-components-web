import { createElement } from "preact";
import { internal } from "../../internal";
import { assert, assertEquals } from "../../utils";
import { BlackboardType } from "../behavior-tree";
import { ContainerActionBehavior, DefaultActionContainerType } from "./action";
import { ActionQr } from "../../components/action-qr";
import {
  InternalBehaviorTreeUpdateEvent,
  InternalUpdateWorldState,
} from "../../private-event-types";
import { hasCustomQrArt } from "../../components/action-qr-custom-art";
import { ActionCardProps } from "../../components/action-card";
import { pollSession } from "../../api";
import { getPaymentEntity } from "./utils/stream-worker";

export class ActionQrBehavior extends ContainerActionBehavior {
  // a status check that finishes after exit() must not overwrite newer world state
  private exited = false;

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

    let channelCodeForQrArt = this.bb.channel.channel_code;

    if (
      this.bb.mock &&
      typeof this.bb.channelProperties?.mock_channel_code_for_qr_art ===
        "string"
    ) {
      // in mock mode, override the channel for custom art purposes with the user selected value
      channelCodeForQrArt =
        this.bb.channelProperties.mock_channel_code_for_qr_art;
    }

    const qrHasCustomArt = hasCustomQrArt(channelCodeForQrArt);

    const container = this.bb.sdk[internal].liveComponents.actionContainer;

    const actionQrProps: Parameters<typeof ActionQr>[0] = {
      amount: this.bb.world.session.amount,
      businessName: this.bb.world.business.name ?? "",
      channelCodeForQrArt: channelCodeForQrArt,
      channelName: this.bb.channel.brand_name,
      channelLogo: this.bb.channel.brand_logo_url,
      currency: this.bb.world.session.currency,
      hideUi: container?.getAttribute("data-qr-code-only") === "true" || false,
      isProdLive: this.bb.sdk.isProdLive(),
      onAffirm: this.affirmPayment.bind(this),
      onCheckStatus: this.checkStatus.bind(this),
      qrString: qrAction.value,
      streamingEnabled:
        this.bb.mock || this.bb.world.experiments?.["stream-session"] === true,
      title: qrAction.action_subtitle,
      t: this.bb.sdk.t.bind(this.bb.sdk),
    };

    const defaultActionContainerType = qrHasCustomArt
      ? DefaultActionContainerType.QrWithCustomArt
      : DefaultActionContainerType.Generic;
    this.cleanupFn = this.ensureHasActionContainer(defaultActionContainerType);

    let cardProps: Omit<ActionCardProps, "children"> | undefined = undefined;
    const withCard = container?.getAttribute("data-with-card") === "true";
    if (withCard) {
      cardProps = {
        actionIconSrc: qrAction.action_graphic,
        actionText: qrAction.action_subtitle,
        channelBrandLogoUrl: this.bb.channel.brand_logo_url,
        channelBrandName: this.bb.channel.brand_name,
        color: this.bb.channel.brand_color,
        removePadding:
          defaultActionContainerType ===
          DefaultActionContainerType.QrWithCustomArt,
        title: qrAction.action_title,
      };
    }
    this.populateActionContainer(
      () => createElement(ActionQr, actionQrProps),
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

  /**
   * Fired when the user clicks "Check status." in prod live with streaming on.
   * A reopened stream sends nothing if the status hasn't changed, so poll once instead.
   */
  async checkStatus(): Promise<boolean> {
    assert(this.bb.world);

    const response = await pollSession(
      this.bb.sdkKey,
      this.bb.sdkKey.sessionAuthKey,
      this.bb.world.sessionTokenRequestId,
    );
    if (this.exited) {
      return true;
    }

    const paymentEntity = getPaymentEntity(response);

    this.bb.dispatchEvent(
      new InternalUpdateWorldState({
        session: response.session,
        paymentEntity: paymentEntity ?? undefined, // do not clear payment entity if this returns null
        succeededChannel: response.succeeded_channel ?? null,
      }),
    );

    return (
      response.session.status !== "ACTIVE" ||
      (paymentEntity !== null &&
        paymentEntity.entity.status !== "REQUIRES_ACTION")
    );
  }

  exit() {
    this.exited = true;
    super.exit();
  }
}
