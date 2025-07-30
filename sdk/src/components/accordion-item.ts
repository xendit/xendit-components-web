import { html, render } from "lit-html";
import {
  AccordionSelectedItemContext,
  XenditAccordionItemClickedEvent
} from "./accordion";
import { getContext, subscribeContext } from "../context";

/**
 * @example
 * <xendit-accordion-item>
 *  <div>Content</div>
 * </xendit-accordion-item>
 */
export class XenditAccordionItemComponent extends HTMLElement {
  static tag = "xendit-accordion-item" as const;

  private originalChildren: Element[] = [];

  constructor() {
    super();
  }

  connectedCallback() {
    this.originalChildren = Array.from(this.children);
    this.render();
  }

  render() {
    const openAccordionItem = subscribeContext(
      this,
      AccordionSelectedItemContext,
      this.onSelectedItemChange
    );

    const isOpen = openAccordionItem === this;
    const containerOpenClass = isOpen
      ? "xendit-accordion-item-open"
      : "xendit-accordion-item-closed";
    const chevronDirection = isOpen ? "down" : "right";

    const title = "Temp title";
    const iconName = "temp-icon";

    render(
      html`
      <div class="xendit-accordion-item-header" @click="${this.onClick}" role="button">
        <xendit-icon icon-name="${iconName}" size="24"></xendit-icon>
        <div class="xendit-accordion-item-header-title">
          ${title}
        </div>
        <xendit-icon icon-name="chevron" size="24" direction="${chevronDirection}"></xendit-icon>
      </div>
      <div class="xendit-accordion-item-container ${containerOpenClass}">
        ${this.originalChildren}
      </div>
      `,
      this
    );
  }

  onSelectedItemChange = () => {
    this.render();
  };

  onClick = () => {
    this.dispatchEvent(new XenditAccordionItemClickedEvent());
  };

  disconnectedCallback() {
    this.replaceChildren(...this.originalChildren);
  }
}
