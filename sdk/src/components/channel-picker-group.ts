import { html, render } from "lit-html";
import { makeTestBffData } from "../test-data";
import { BffPaymentMethod, BffPaymentMethodGroup } from "../bff-types";
import { getContext } from "../context";
import { PaymentMethodsContext } from "./session-provider";
import { assert } from "../utils";

/**
 * @example
 * <xendit-channel-picker-group .group=${BffPaymentMethodGroup} />
 */
export class XenditChannelPickerGroupComponent extends HTMLElement {
  static tag = "xendit-channel-picker-group" as const;

  public group: BffPaymentMethodGroup | null = null;
  private selectedChannel: BffPaymentMethod | null = null;

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

    this.selectedChannel =
      paymentMethods.find(
        (method) => method.channel_code === selectElement.value
      ) || null;
    this.render();
  };

  render() {
    const paymentMethods = getContext(this, PaymentMethodsContext);
    if (!paymentMethods) return;

    const channels = this.group?.channels ?? [];
    let selectedChannel = this.selectedChannel;
    if (channels.length === 1) {
      // If there's only one channel, select it automatically
      selectedChannel =
        paymentMethods.find((method) => method.channel_code === channels[0]) ??
        null;
    }

    // Render a dropdown with all channels in the group
    let dropdown = null;
    if (channels.length > 1) {
      dropdown = html`
        <select id="xendit-channel-picker" @change="${
          this.onSelectedChannelChange
        }">
          <option value="" disabled selected>Select a channel</option>
          ${channels.map((channel) => {
            return html`
            <option value="${channel}">
              ${channel}
            </option>
            `;
          })}
        </select>`;
    }

    // render the form if a channel is selected
    let channelComponent = null;
    if (selectedChannel) {
      channelComponent = html`<xendit-payment-channel channel-code="${selectedChannel.channel_code}"></xendit-payment-channel>`;
    }

    render(
      html`
      <div>
        ${dropdown}
        ${channelComponent}
      </div>`,
      this
    );
  }
}
