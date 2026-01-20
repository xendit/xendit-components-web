export function registerElement(
  element: CustomElementConstructor & { tag: string },
) {
  if (typeof window === "undefined" || !window.customElements) return;
  customElements.define(element.tag, element);
}

export function findFirstStyleOrLinkElement() {
  return document.querySelector("style, link");
}
