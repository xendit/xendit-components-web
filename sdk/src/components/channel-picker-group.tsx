import React, { useLayoutEffect, useState } from "react";
import { useChannels, useSdk, useSession } from "./session-provider";
import { bffChannelToPublicChannel } from "../bff-marshal";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { Dropdown, DropdownOption } from "./dropdown";
import { BffSession } from "../backend-types/session";

interface ChannelPickerGroupProps {
  group: BffChannelUiGroup | null;
  open: boolean;
}

export const ChannelPickerGroup: React.FC<ChannelPickerGroupProps> = (
  props,
) => {
  const { group, open } = props;

  const sdk = useSdk();
  const session = useSession();

  // container for the selected channel component
  const containerRef = React.useRef<HTMLDivElement>(null);
  // reference to the selected channel element
  const selectedChannelElementRef = React.useRef<HTMLElement>(null);

  const [explicitSelectedChannel, setExplicitSelectedChannel] =
    useState<BffChannel | null>(null);
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
          bffChannelToPublicChannel(selectedChannel),
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
  const onSelectedChannelChange = (dropdownOption: DropdownOption) => {
    const selected =
      channels.find(
        (channel) => channel.channel_code === dropdownOption.value,
      ) || null;
    setExplicitSelectedChannel(selected);
  };

  // Create channel options for dropdown
  const channelOptions = channelsInGroup.map<DropdownOption>((channel) => ({
    leadingAsset: (
      <img
        className="xendit-channel-logo"
        src={channel.brand_logo_url}
        key={channel.channel_code}
      />
    ),
    title: channel.brand_name,
    value: channel.channel_code,
    disabled: !shouldEnableChannel(session, channel),
    description: getChannelDisabledReason(session, channel) || undefined,
  }));

  // Hide dropdown for cards channel
  const hideDropdown =
    channelsInGroup.length === 1 && channelsInGroup[0].channel_code === "CARDS";

  return (
    <div className="xendit-channel-picker-group">
      {hideDropdown ? null : (
        <Dropdown
          options={channelOptions}
          onChange={onSelectedChannelChange}
          placeholder={"Select a payment method"}
        />
      )}
      <div ref={containerRef} />
    </div>
  );
};

export function shouldEnableChannel(
  session: BffSession,
  channel: BffChannel,
): boolean {
  if (session.session_type !== "PAY") {
    return true; // only pay sessions have min/max
  }

  const amount = session.amount;
  const min = channel.min_amount ?? 0;
  const max = channel.max_amount ?? Number.MAX_VALUE;
  if (amount < min || amount > max) {
    return false;
  }

  return true;
}

export function getChannelDisabledReason(
  session: BffSession,
  channel: BffChannel,
): string | null {
  if (shouldEnableChannel(session, channel)) {
    return null;
  }

  return "Unavailable for this payment";
}
