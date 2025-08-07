import React, { useLayoutEffect, useState } from "react";
import { BffChannelUiGroup } from "../bff-types";
import { Channel } from "../forms-types";
import { useChannels, useSdk } from "./session-provider";
import { bffChannelToPublicChannel } from "../bff-marshal";

interface ChannelPickerGroupProps {
  group: BffChannelUiGroup | null;
}

export const ChannelPickerGroup: React.FC<ChannelPickerGroupProps> = ({
  group
}) => {
  const sdk = useSdk();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const selectedChannelElementRef = React.useRef<HTMLElement>(null);

  const [explicitSelectedChannel, setExplicitSelectedChannel] =
    useState<Channel | null>(null);
  const channels = useChannels();

  const onSelectedChannelChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (!channels) return;

    const target = event.target as HTMLSelectElement;

    const selected =
      channels.find((channel) => channel.channel_code === target.value) || null;

    setExplicitSelectedChannel(selected);
  };

  const channelsInGroup =
    channels?.filter((method) => method.ui_group === group?.id) || [];

  // If there's only one channel in the group, select it automatically
  const selectedChannel =
    channelsInGroup.length === 1 ? channelsInGroup[0] : explicitSelectedChannel;

  // Create and mount the channel component if a channel is selected
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (selectedChannel) {
      selectedChannelElementRef.current = sdk.createPaymentComponentForChannel(
        bffChannelToPublicChannel(selectedChannel)
      );
      containerRef.current.replaceChildren(selectedChannelElementRef.current);
    } else {
      containerRef.current.replaceChildren();
    }
  }, [selectedChannel, sdk]);

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
