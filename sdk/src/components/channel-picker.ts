import { html, render } from "lit-html";
import { getContext } from "../context";
import { ChannelUiGroupsContext, ChannelsContext } from "./session-provider";
import { Channel } from "../forms-types";

/**
 * @example
 * <xendit-channel-picker/>
 */
export class XenditChannelPickerComponent extends HTMLElement {
  static tag = "xendit-channel-picker" as const;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  onSelectChannelGroup = (event: Event) => {
    const target = event.target as HTMLElement;
    const channelUiGroups = getContext(this, ChannelUiGroupsContext);
    if (!channelUiGroups) return;

    const channels = getContext(this, ChannelsContext);
    if (!channels) return;

    const index = parseInt(target.getAttribute("index") || "0", 10);
    const group = channelUiGroups[index];
    if (!group) return;

    const channelsInGroup = channels.filter(
      (method) => method.ui_group === group.id
    );
    if (channelsInGroup.length === 1) {
      const channel = channelsInGroup[0];
      this.dispatchEvent(new XenditChannelPickedEvent(channel));
    }
  };

  render() {
    const channelUiGroups = getContext(this, ChannelUiGroupsContext);
    if (!channelUiGroups) return;

    render(
      html`
        <xendit-accordion>
          ${channelUiGroups.map((group, i) => {
            return html`
              <xendit-accordion-item
                title="${group.label}"
                icon="${group.icon_url}"
                @click="${this.onSelectChannelGroup}"
                index="${i}"
              >
                <xendit-channel-picker-group
                  .group="${group}"
                ></xendit-channel-picker-group>
              </xendit-accordion-item>
            `;
          })}
        </xendit-accordion>
      `,
      this
    );
  }
}

export class XenditChannelPickedEvent extends Event {
  static type = "xendit-channel-picked" as const;
  public channel: Channel;

  constructor(channel: Channel) {
    super("xendit-channel-picked", {
      bubbles: true,
      composed: true
    });
    this.channel = channel;
  }
}
