import {
  useCurrentChannel,
  useChannels,
  useSdk,
  useSession,
} from "./session-provider";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { Dropdown, DropdownOption } from "./dropdown";
import { BffSession } from "../backend-types/session";
import { useIdSafe, usePrevious } from "../utils";
import { useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";
import { findChannelPairs, singleBffChannelToPublic } from "../bff-marshal";
import { TFunction } from "i18next";

interface ChannelPickerGroupProps {
  group: BffChannelUiGroup;
  open: boolean;
}

export const ChannelPickerGroup: React.FC<ChannelPickerGroupProps> = (
  props,
) => {
  const { group, open } = props;

  const sdk = useSdk();
  const { t } = sdk;
  const session = useSession();

  const sessionType = session.session_type;

  const dropdownId = useIdSafe();

  // container for the selected channel component
  const containerRef = useRef<HTMLDivElement>(null);
  // reference to the selected channel element
  const selectedChannelElementRef = useRef<HTMLElement>(null);

  const sdkSelectedChannelCode =
    useCurrentChannel().channel?.channel_code ?? null;

  const [explicitSelectedChannel, setExplicitSelectedChannel] =
    useState<BffChannel | null>(null);
  const channels = useChannels();

  const pairChannelData = useMemo(() => findChannelPairs(channels), [channels]);

  const channelsInGroup = useMemo(() => {
    return channels.filter((ch) => {
      if (ch.ui_group !== group.id) {
        // skip channels not in this group
        return false;
      }
      if (pairChannelData.paired[ch.channel_code]) {
        // skip channels that are the second channel in a pair
        return false;
      }
      return true;
    });
  }, [channels, group.id, pairChannelData]);

  // Create and mount the channel component if a channel is selected
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (explicitSelectedChannel) {
      if (open) {
        // create new channel component
        const el = sdk.createChannelComponent(
          singleBffChannelToPublic(explicitSelectedChannel, pairChannelData),
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
  }, [explicitSelectedChannel, sdk, open, pairChannelData]);

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
        // update sdk state to match this group's selection if this group is opened and has a selection that differs from sdk state
        sdk.setCurrentChannel(
          singleBffChannelToPublic(explicitSelectedChannel, pairChannelData),
        );
      } else if (!explicitSelectedChannel) {
        // clear sdk selection if this group is opened and this group has no selection
        sdk.setCurrentChannel(null);
      }
    }
  }, [
    channelsInGroup,
    explicitSelectedChannel,
    open,
    previousOpen,
    sdk,
    sdkSelectedChannelCode,
    pairChannelData,
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
    description: getChannelDisabledReason(t, session, channel) || undefined,
  }));

  // Hide dropdown for cards channel
  const hideDropdown =
    channelsInGroup.length === 1 && channelsInGroup[0].channel_code === "CARDS";

  return (
    <div className="xendit-channel-picker-group">
      {hideDropdown ? null : (
        <div className="xendit-channel-form-field-group">
          <label htmlFor={dropdownId} className="xendit-text-14">
            {sessionType === "SAVE"
              ? t("payment_methods.add_payment_method", {
                  groupName: group.label ?? "",
                  ns: "session",
                })
              : t("payment_methods.pay_with")}
          </label>
          <Dropdown
            id={dropdownId}
            selectedIndex={
              channelOptions.findIndex((channel) => {
                return channel.value === explicitSelectedChannel?.channel_code;
              }) ?? 0
            }
            options={channelOptions}
            onChange={onSelectedChannelChange}
            placeholder={t("payment_methods.select_channel_placeholder", {
              groupName: group.label,
              ns: "session",
            })}
          />
        </div>
      )}
      {explicitSelectedChannel ? <div ref={containerRef} /> : null}
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
  t: TFunction<"session">,
  session: BffSession,
  channel: BffChannel,
): string | null {
  if (shouldEnableChannel(session, channel)) {
    return null;
  }

  if (channel.min_amount && session.amount < channel.min_amount) {
    return t("payment_methods.channel_disabled_amount_too_small");
  } else {
    return t("payment_methods.channel_disabled_amount_too_large");
  }
}
