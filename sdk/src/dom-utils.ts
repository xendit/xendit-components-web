export function registerElement(
  element: CustomElementConstructor & { tag: string },
) {
  customElements.define(element.tag, element);
}

export function findFirstStyleOrLinkElement() {
  return document.querySelector("style, link");
}
