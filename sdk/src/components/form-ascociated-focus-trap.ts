import { registerElement } from "../dom-utils";

/**
 * https://html.spec.whatwg.org/multipage/forms.html#category-label
 * See the definition of "labelable".
 * This is a custom element which is labelable.
 *
 * This makes it possible to catch focus events when a label element is
 * clicked without adding any interactive elements.
 */
export class XenditFormAssociatedFocusTrap extends HTMLElement {
  static tag = "xendit-form-associated-focus-trap" as const;
  static formAssociated = true;
  private internals: ElementInternals;
  constructor() {
    super();
    this.internals = this.attachInternals();
  }
}
registerElement(XenditFormAssociatedFocusTrap);

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "xendit-form-associated-focus-trap": preact.DetailedHTMLProps<
        preact.HTMLAttributes<XenditFormAssociatedFocusTrap>,
        XenditFormAssociatedFocusTrap
      >;
    }
  }
}
