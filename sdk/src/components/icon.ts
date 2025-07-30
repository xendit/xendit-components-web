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
    this.render();
  }

  render() {
    const iconName = this.getAttribute("icon-name") || "default-icon";
    const size = parseInt(this.getAttribute("size") || "24", 10);

    render(
      html`<svg
        height="${size}"
        width="${size}"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <use href="#${iconName}"></use>
      </svg>`,
      this
    );
  }
}
