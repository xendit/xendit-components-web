export class XenditPaymentChannelComponent extends HTMLElement {
  static tag = "xendit-payment-channel" as const;
}

export interface HTMLElementTagNameMap {
  [XenditPaymentChannelComponent.tag]: XenditPaymentChannelComponent;
}

export interface ChannelPickerCustomEvent extends Event {
  type: "customevent";
}

export interface HTMLElementEventMap {
  customevent: ChannelPickerCustomEvent;
}
