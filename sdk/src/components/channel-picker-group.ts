import { html, render } from "lit-html";
import { getContext } from "../context";
import { BffChannelUiGroup } from "../bff-types";
import { ChannelsContext } from "./session-provider";
import { Channel } from "../forms-types";

/**
 * @example
 * <xendit-channel-picker-group .group=${BffPaymentMethodGroup} />
 */
export class XenditChannelPickerGroupComponent extends HTMLElement {
  static tag = "xendit-channel-picker-group" as const;

  public group: BffChannelUiGroup | null = null;
  private selectedChannel: Channel | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  onSelectedChannelChange = (event: Event) => {
    const selectElement = event.target as HTMLSelectElement;
    const channels = getContext(this, ChannelsContext);
    if (!channels) return;

    this.selectedChannel =
      channels.find(
        (channel) => channel.channel_code === selectElement.value
      ) || null;
    this.render();
  };

  render() {
    const channels = getContext(this, ChannelsContext);
    if (!channels) return;

    const channelsInGroup = channels.filter(
      (method) => method.ui_group === this.group?.id
    );

    if (channelsInGroup.length === 0) {
      this.replaceChildren();
      return;
    }

    let selectedChannel = this.selectedChannel;
    if (channelsInGroup.length === 1) {
      // If there's only one pm, select it automatically
      selectedChannel = channelsInGroup[0];
    }
    if (channelsInGroup.length === 0) {
      this.replaceChildren();
      return;
    }

    // Render a dropdown with all channels in the group
    let dropdown = null;
    if (channelsInGroup.length > 1) {
      // Make a list of all valid channel codes
      const channelOptions = channelsInGroup
        .map((channel) => {
          return {
            label: channel.brand_name,
            channelCode: channel.channel_code
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
    if (selectedChannel) {
      channelComponent = html`<xendit-payment-channel
        .channel="${selectedChannel}"
      ></xendit-payment-channel>`;
    }

    render(html` <div>${dropdown} ${channelComponent}</div>`, this);
  }
}
