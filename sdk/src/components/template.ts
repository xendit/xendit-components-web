class XenditMyComponent extends HTMLElement {
  static tag = "xendit-my-component" as const;
}

export interface HTMLElementTagNameMap {
  [XenditMyComponent.tag]: XenditMyComponent;
}

export interface MyComponentCustomEvent extends Event {
  type: "customevent";
}

export interface HTMLElementEventMap {
  customevent: MyComponentCustomEvent;
}
