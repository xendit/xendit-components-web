import React, { useLayoutEffect, useState } from "react";
import { BffChannelUiGroup } from "../bff-types";
import { Channel } from "../forms-types";
import { useChannels, useSdk } from "./session-provider";
import { bffChannelToPublicChannel } from "../bff-marshal";

interface ChannelPickerGroupProps {
  group: BffChannelUiGroup | null;
  open: boolean;
}

export const ChannelPickerGroup: React.FC<ChannelPickerGroupProps> = (
  props
) => {
  const { group, open } = props;

  const sdk = useSdk();

  // container for the selected channel component
  const containerRef = React.useRef<HTMLDivElement>(null);
  // reference to the selected channel element
  const selectedChannelElementRef = React.useRef<HTMLElement>(null);

  const [explicitSelectedChannel, setExplicitSelectedChannel] =
    useState<Channel | null>(null);
  const channels = useChannels();

  const channelsInGroup =
    channels?.filter((method) => method.ui_group === group?.id) || [];

  // If there's only one channel in the group, select it automatically
  const selectedChannel =
    channelsInGroup.length === 1 ? channelsInGroup[0] : explicitSelectedChannel;

  // Create and mount the channel component if a channel is selected
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (selectedChannel) {
      if (open) {
        // create new channel component
        const el = sdk.createPaymentComponentForChannel(
          bffChannelToPublicChannel(selectedChannel)
        );
        selectedChannelElementRef.current = el;
        if (el.parentElement !== containerRef.current) {
          containerRef.current.replaceChildren(el);
        } else {
          // it's already in the right place, do nothing.
          // replaceChildren would cause iframes to reload even if we do a no-op update.
        }
      }
    } else {
      containerRef.current.replaceChildren();
    }
  }, [selectedChannel, sdk, open]);

  // Called on channel dropdown change
  const onSelectedChannelChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (!channels) return;

    const target = event.target as HTMLSelectElement;
    const selected =
      channels.find((channel) => channel.channel_code === target.value) || null;
    setExplicitSelectedChannel(selected);
  };

  // Create channel options for dropdown
  const channelOptions = channelsInGroup.map((channel) => ({
    label: channel.brand_name,
    channelCode: channel.channel_code
  }));

  return (
    <div className="xendit-channel-picker-group">
      {channelsInGroup.length > 1 ? (
        <select onChange={onSelectedChannelChange}>
          <option value="" disabled>
            Select a channel
          </option>
          {channelOptions.map((ch) => (
            <option key={ch.channelCode} value={ch.channelCode}>
              {ch.label}
            </option>
          ))}
        </select>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
};
