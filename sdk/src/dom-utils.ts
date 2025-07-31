export function emptyElement(element: HTMLElement) {
  element.replaceChildren();
}

export function registerElement(
  element: CustomElementConstructor & { tag: string }
) {
  customElements.define(element.tag, element);
}

/**
 * Remove the index property from a type
 */
type RemoveIndex<T> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
    ? never
    : symbol extends K
    ? never
    : K]: T[K];
};

/**
 * Remove all properties from a type that are not strings.
 */
type RemoveNonStringProperties<T> = Pick<
  T,
  {
    [P in keyof T]: T[P] extends string ? P : never;
  }[keyof T]
>;

/**
 * All CSS properties.
 */
type CSSProperties = RemoveIndex<
  RemoveNonStringProperties<CSSStyleDeclaration>
>;

export function setInlineStyles(
  element: HTMLElement,
  styles: Partial<CSSProperties>
) {
  for (const [key, value] of Object.entries(styles)) {
    element.style.setProperty(key, value);
  }
}
