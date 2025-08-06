import { html, render } from "lit-html";
import { getContext } from "../context";
import { ChannelsContext } from "./session-provider";
import { Channel } from "../forms-types";

/**
 * @example
 * <xendit-channel-picker .paymentMethod="${Channel}" />
 */
export class XenditPaymentChannelComponent extends HTMLElement {
  static tag = "xendit-payment-channel" as const;

  public paymentMethod: Channel | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const paymentMethods = getContext(this, ChannelsContext);
    if (!paymentMethods) return;

    const paymentMethod = this.paymentMethod;
    if (!paymentMethod) {
      this.replaceChildren();
      return;
    }

    const channelConfig = pickChannelConfig(paymentMethod);
    if (!channelConfig) return;

    let form = null;
    if (channelConfig.form) {
      form = html`<xendit-channel-form
        .form="${channelConfig.form}"
      ></xendit-channel-form>`;
    }

    render(
      html`
        ${form}
        <div class="xendit-payment-channel-instructions">
          <xendit-icon name="info" size="16"></xendit-icon>
          <div class="xendit-text-14">
            ${channelConfig.instructions.map(
              (instr) => html`<div>${instr}</div>`
            )}
          </div>
        </div>
      `,
      this
    );
  }
}

export function pickChannelConfig(pm: Channel) {
  if ("always" in pm.channel_configuration) {
    return pm.channel_configuration.always;
  }
  // TODO: handle pay, save, pay_and_save
}
