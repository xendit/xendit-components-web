import { html, render } from "lit-html";
import { getContext } from "../context";
import { PaymentMethodsContext } from "./session-provider";
import { ChannelConfiguration, PaymentMethod } from "../forms-types";

/**
 * @example
 * <xendit-channel-picker .paymentMethod="${PaymentMethod}" />
 */
export class XenditPaymentChannelComponent extends HTMLElement {
  static tag = "xendit-payment-channel" as const;

  public paymentMethod: PaymentMethod | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const paymentMethods = getContext(this, PaymentMethodsContext);
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
            You’ll be redirected to Standard Chartered Bank’s page
            <br />
            Follow the prompts on the page to complete your payment
          </div>
        </div>
      `,
      this
    );
  }
}

export function pickChannelConfig(pm: PaymentMethod) {
  if ("always" in pm.channel_configuration) {
    return pm.channel_configuration.always;
  }
  // TODO: handle pay, save, pay_and_save
}
