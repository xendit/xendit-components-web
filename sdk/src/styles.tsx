import { findFirstStyleOrLinkElement } from "./dom-utils";
import css from "./styles.css";

export function createStyles() {
  const styleElement = document.createElement("style");
  styleElement.textContent = css;
  const firstStyleOrLinkElement = findFirstStyleOrLinkElement();
  if (firstStyleOrLinkElement) {
    firstStyleOrLinkElement.insertAdjacentElement("beforebegin", styleElement);
  } else {
    document.head.appendChild(styleElement);
  }
}
