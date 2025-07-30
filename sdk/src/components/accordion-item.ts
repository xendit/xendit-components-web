import { html, render } from "lit-html";
import {
  AccordionSelectedItemContext,
  XenditAccordionItemClickedEvent
} from "./accordion";
import { getContext } from "../context";

const accordionItemTemplate = (props: {
  iconName: string;
  title: string;
  body: Node[];
  clickHandler: () => void;
  open: boolean;
}) => {
  const containerOpenClass = props.open ? "xendit-accordion-item-open" : "";
  return html`
  <div class="xendit-accordion-item-header" @click=${props.clickHandler}>
    <xendit-icon icon-name="${props.iconName}" size="24" />
    <div class="xendit-accordion-item-header-title">
      ${props.title}
    </div>
  </div>
  <div class="xendit-accordion-item-container ${containerOpenClass}">
    ${props.body}
  </div>
`;
};

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

    render(
      accordionItemTemplate({
        iconName: "icon-name",
        title: "Accordion Item Title",
        body: this.originalChildren,
        clickHandler: this.onClick,
        open: openAccordionItem === this
      }),
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
