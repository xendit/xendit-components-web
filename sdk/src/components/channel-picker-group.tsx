import {
  useActiveChannel,
  useChannels,
  useSdk,
  useSession,
} from "./session-provider";
import { bffChannelToPublicChannel } from "../bff-marshal";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { Dropdown, DropdownOption } from "./dropdown";
import { BffSession } from "../backend-types/session";
import { usePrevious } from "../utils";
import { useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";

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
  const containerRef = useRef<HTMLDivElement>(null);
  // reference to the selected channel element
  const selectedChannelElementRef = useRef<HTMLElement>(null);

  const sdkSelectedChannelCode = useActiveChannel()?.channel_code ?? null;

  const [explicitSelectedChannel, setExplicitSelectedChannel] =
    useState<BffChannel | null>(null);
  const channels = useChannels();

  const channelsInGroup = useMemo(() => {
    return channels?.filter((method) => method.ui_group === group?.id) || [];
  }, [channels, group?.id]);

  // Create and mount the channel component if a channel is selected
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (explicitSelectedChannel) {
      if (open) {
        // create new channel component
        const el = sdk.createPaymentComponentForChannel(
          bffChannelToPublicChannel(explicitSelectedChannel),
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
  }, [explicitSelectedChannel, sdk, open]);

  // when the group is opened, auto-select a channel if needed
  const previousOpen = usePrevious(open);
  useLayoutEffect(() => {
    if (open && !previousOpen) {
      // only run this when the group is opened
      if (channelsInGroup.length === 1 && explicitSelectedChannel === null) {
        // auto-select channel if this group contains only one
        setExplicitSelectedChannel(channelsInGroup[0]);
      } else if (
        explicitSelectedChannel &&
        sdkSelectedChannelCode !== explicitSelectedChannel.channel_code
      ) {
        // update sdk state to match this group's explicit selection
        sdk.setActiveChannel(
          bffChannelToPublicChannel(explicitSelectedChannel),
        );
      }
    }
  }, [
    channelsInGroup,
    explicitSelectedChannel,
    open,
    previousOpen,
    sdk,
    sdkSelectedChannelCode,
  ]);

  // when the sdk selected channel changes, update this group's selection if needed
  const previousSdkSelectedChannelCode =
    usePrevious(sdkSelectedChannelCode) ?? null;
  useLayoutEffect(() => {
    if (sdkSelectedChannelCode !== previousSdkSelectedChannelCode) {
      // only run this when the sdk selected channel changes
      if (sdkSelectedChannelCode === null) {
        // do nothing if the selected channel is cleared, we want to collapse the group if the selection cleared rather than clearing explicitlySelectedChannel
        return;
      }

      if (sdkSelectedChannelCode !== explicitSelectedChannel?.channel_code) {
        // if the sdk selected channel is part of this group and is different from the user selected one, update this group selection
        const newSelected = channelsInGroup.find(
          (channel) => channel.channel_code === sdkSelectedChannelCode,
        );
        if (newSelected) {
          setExplicitSelectedChannel(newSelected);
        }
      }
    }
  }, [
    channelsInGroup,
    explicitSelectedChannel?.channel_code,
    previousSdkSelectedChannelCode,
    sdk,
    sdkSelectedChannelCode,
  ]);

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
          selectedIndex={
            channelOptions.findIndex((channel) => {
              return channel.value === explicitSelectedChannel?.channel_code;
            }) ?? 0
          }
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
