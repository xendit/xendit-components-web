import { createContext, provideContext } from "../context";

export const AccordionSelectedItemContext = createContext<EventTarget | null>(
  "accordion-selected-item"
);

/**
 * @example
 * <xendit-accordion>
 *   <xendit-accordion-item>Content</xendit-accordion-item>
 *   <xendit-accordion-item>Content</xendit-accordion-item>
 * </xendit-accordion>
 */
export class XenditAccordionComponent extends HTMLElement {
  static tag = "xendit-accordion" as const;

  private selectedItem: EventTarget | null = null;
  private accordionContextProvider = provideContext(
    this,
    AccordionSelectedItemContext
  );

  constructor() {
    super();
    this.addEventListener(
      XenditAccordionItemClickedEvent.type,
      (event: XenditAccordionItemClickedEvent) => {
        this.selectedItem = event.target;
        this.accordionContextProvider.set(this.selectedItem);
        event.stopPropagation();
      }
    );
  }

  connectedCallback() {}
}

export class XenditAccordionItemClickedEvent extends Event {
  static type = "xendit-accordion-item-clicked" as const;

  constructor() {
    super(XenditAccordionItemClickedEvent.type, {
      bubbles: true,
      composed: true
    });
  }
}
