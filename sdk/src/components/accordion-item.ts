import { html, render } from "lit-html";
import {
  AccordionSelectedItemContext,
  XenditAccordionItemClickedEvent
} from "./accordion";
import { subscribeContext } from "../context";

/**
 * @example
 * <xendit-accordion-item>
 *  <div>Content</div>
 * </xendit-accordion-item>
 */
export class XenditAccordionItemComponent extends HTMLElement {
  static tag = "xendit-accordion-item" as const;
  static observedAttributes = ["open", "title", "icon-name"];

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

    const isOpen = openAccordionItem === this || this.hasAttribute("open");
    const containerOpenClass = isOpen
      ? "xendit-accordion-item-open"
      : "xendit-accordion-item-closed";
    const chevronDirection = isOpen ? "down" : "right";

    const title = this.getAttribute("title") || "";
    const iconName = this.getAttribute("icon-name") || "chevron";

    render(
      html`
        <div
          class="xendit-accordion-item-header"
          @click="${this.onClick}"
          role="button"
        >
          <xendit-icon icon-name="${iconName}" size="24"></xendit-icon>
          <div class="xendit-accordion-item-header-title xendit-text-16">
            ${title}
          </div>
          <xendit-icon
            icon-name="chevron"
            size="24"
            direction="${chevronDirection}"
          ></xendit-icon>
        </div>
        <div class="xendit-accordion-item-content ${containerOpenClass}">
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
