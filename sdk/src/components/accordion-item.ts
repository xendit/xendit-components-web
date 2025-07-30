import { html, render } from "lit-html";
import {
  AccordionSelectedItemContext,
  XenditAccordionItemClickedEvent
} from "./accordion";
import { getContext } from "../context";

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
    const openAccordionItem = getContext(this, AccordionSelectedItemContext);

    const containerOpenClass =
      openAccordionItem === this ? "xendit-accordion-item-open" : "";

    const title = "Temp title";
    const iconName = "temp-icon";

    render(
      html`
      <div class="xendit-accordion-item-header" @click=${this.onClick}>
        <xendit-icon icon-name="${iconName}" size="24" />
        <div class="xendit-accordion-item-header-title">
          ${title}
        </div>
      </div>
      <div class="xendit-accordion-item-container ${containerOpenClass}">
        ${this.originalChildren}
      </div>
      `,
      this
    );
  }

  onClick = () => {
    this.dispatchEvent(new XenditAccordionItemClickedEvent());
  };

  disconnectedCallback() {
    this.replaceChildren(...this.originalChildren);
  }
}
