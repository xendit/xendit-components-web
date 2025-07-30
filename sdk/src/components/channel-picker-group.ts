import { html, render } from "lit-html";

/**
 * @example
 * <xendit-channel-picker-group group-id="group-id" />
 */
export class XenditChannelPickerGroupComponent extends HTMLElement {
  static tag = "xendit-channel-picker-group" as const;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const groupId = this.getAttribute("group-id") || "default-group";

    // Render the group container
    render(
      html`<div>
        channel picker content here for group: ${groupId} 
      </div>`,
      this
    );
  }
}
