import { html, render } from "lit-html";

/**
 * @example
 * <xendit-icon icon-name="icon-name" size="24" />
 */
export class XenditIconComponent extends HTMLElement {
  static tag = "xendit-icon" as const;
  static observedAttributes = ["icon-name", "size"];

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  render() {
    const iconName = this.getAttribute("icon-name") || "default-icon";
    const size = parseInt(this.getAttribute("size") || "24", 10);

    // TODO: replace with <use/> element
    render(
      html`<svg
        height="${size}"
        width="${size}"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
      </svg>`,
      this
    );
  }
}
