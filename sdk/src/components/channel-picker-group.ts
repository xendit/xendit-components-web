import { html, render } from "lit-html";
import { BffPaymentMethod, BffPaymentMethodGroup } from "../bff-types";
import { getContext } from "../context";
import { PaymentMethodsContext } from "./session-provider";
import { pickChannelConfig } from "./payment-channel";

/**
 * @example
 * <xendit-channel-picker-group .group=${BffPaymentMethodGroup} />
 */
export class XenditChannelPickerGroupComponent extends HTMLElement {
  static tag = "xendit-channel-picker-group" as const;

  public group: BffPaymentMethodGroup | null = null;
  private selectedPaymentMethod: BffPaymentMethod | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  onSelectedChannelChange = (event: Event) => {
    const selectElement = event.target as HTMLSelectElement;
    const paymentMethods = getContext(this, PaymentMethodsContext);
    if (!paymentMethods) return;

    this.selectedPaymentMethod =
      paymentMethods.find(
        (method) =>
          pickChannelConfig(method)?.channel_code === selectElement.value
      ) || null;
    this.render();
  };

  render() {
    const paymentMethods = getContext(this, PaymentMethodsContext);
    if (!paymentMethods) return;

    const paymentMethodsInGroup = paymentMethods.filter(
      (method) => method.group === this.group?.id
    );

    if (paymentMethodsInGroup.length === 0) {
      this.replaceChildren();
      return;
    }

    let selectedPaymentMethod = this.selectedPaymentMethod;
    if (paymentMethodsInGroup.length === 1) {
      // If there's only one pm, select it automatically
      selectedPaymentMethod = paymentMethodsInGroup[0];
    }
    if (paymentMethodsInGroup.length === 0) {
      this.replaceChildren();
      return;
    }

    // Render a dropdown with all channels in the group
    let dropdown = null;
    if (paymentMethodsInGroup.length > 1) {
      // Make a list of all valid channel codes
      const channelOptions = paymentMethodsInGroup
        .map((method) => {
          const channelConfig = pickChannelConfig(method);
          if (!channelConfig) return null;
          return {
            label: method.brand_name,
            channelCode: channelConfig.channel_code
          };
        })
        .filter((code) => code !== null);

      dropdown = html` <select
        id="xendit-channel-picker"
        @change="${this.onSelectedChannelChange}"
      >
        <option value="" disabled selected>Select a channel</option>
        ${channelOptions.map((ch) => {
          return html` <option value="${ch.channelCode}">${ch.label}</option> `;
        })}
      </select>`;
    }

    // render the form if a channel is selected
    let channelComponent = null;
    if (selectedPaymentMethod) {
      channelComponent = html`<xendit-payment-channel
        .paymentMethod="${selectedPaymentMethod}"
      ></xendit-payment-channel>`;
    }

    render(html` <div>${dropdown} ${channelComponent}</div>`, this);
  }
}
