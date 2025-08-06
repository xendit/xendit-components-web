import { html, render } from "lit-html";
import { getContext } from "../context";
import { ChannelsContext } from "./session-provider";
import { Channel, ChannelWrapper } from "../forms-types";

/**
 * @example
 * <xendit-channel-picker .channel="${Channel}" />
 */
export class XenditPaymentChannelComponent extends HTMLElement {
  static tag = "xendit-payment-channel" as const;

  public channel: Channel | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const channels = getContext(this, ChannelsContext);
    if (!channels) return;

    const channel = this.channel;
    if (!channel) {
      this.replaceChildren();
      return;
    }

    let form = null;
    if (channel.form) {
      form = html`<xendit-channel-form
        .form="${channel.form}"
      ></xendit-channel-form>`;
    }

    render(
      html`
        ${form}
        <div class="xendit-payment-channel-instructions">
          <xendit-icon name="info" size="16"></xendit-icon>
          <div class="xendit-text-14">
            ${channel.instructions.map((instr) => html`<div>${instr}</div>`)}
          </div>
        </div>
      `,
      this
    );
  }
}
