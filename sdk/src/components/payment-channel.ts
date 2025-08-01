import { html, render } from "lit-html";
import { getContext } from "../context";
import { PaymentMethodsContext } from "./session-provider";

/**
 * @example
 * <xendit-channel-picker/>
 */
export class XenditPaymentChannelComponent extends HTMLElement {
  static tag = "xendit-payment-channel" as const;
  static observedAttributes = ["channel-code"];

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (this.isConnected && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const paymentMethods = getContext(this, PaymentMethodsContext);
    if (!paymentMethods) return;

    const paymentMethod = paymentMethods.find(
      (method) => method.channel_code === this.getAttribute("channel-code")
    );
    if (!paymentMethod) return;

    let form = null;
    if (paymentMethod.form) {
      form = html`<xendit-channel-form
        .form="${paymentMethod.form}"
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
