import {
  useCurrentChannel,
  useChannels,
  useSdk,
  useSession,
} from "./session-provider";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { Dropdown, DropdownOption } from "./dropdown";
import { BffSession } from "../backend-types/session";
import { satisfiesMinMax, useIdSafe, usePrevious } from "../utils";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import {
  channelFilterFn,
  findChannelPairs,
  singleBffChannelToPublic,
} from "../bff-marshal";
import { TFunction } from "i18next";
import { FunctionComponent } from "preact";

interface ChannelPickerGroupProps {
  group: BffChannelUiGroup;
  open: boolean;
}

export const ChannelPickerGroup: FunctionComponent<ChannelPickerGroupProps> = (
  props,
) => {
  const { group, open } = props;

  const sdk = useSdk();
  const { t } = sdk;
  const session = useSession();
  const channels = useChannels();

  const currentChannel = useCurrentChannel().channel;

  const sessionType = session.session_type;

  const dropdownId = useIdSafe();

  // record the last user selection in the dropdown.
  // if the current channel selection is not part of this group, use this instead.
  // if this is set, and the current channel is null, when the group is opened we will restore this selection.
  const [fakeDropdownSelection, setFakeDropdownSelection] = useState<
    string | null
  >(null);

  // container for the selected channel component
  const containerRef = useRef<HTMLDivElement>(null);
  // if true, the container has something in it
  const [containerIsPopulated, setContainerIsPopulated] = useState(false);
  // reference to the selected channel element
  const selectedChannelElementRef = useRef<HTMLElement>(null);

  const pairChannelData = useMemo(() => findChannelPairs(channels), [channels]);
  const marshalConfig = useMemo(
    () => ({
      pairChannels: pairChannelData,
      session: {
        amount: session.amount,
        session_type: session.session_type,
      },
      options: { filterMinMax: false },
    }),
    [pairChannelData, session.amount, session.session_type],
  );

  const channelsInGroup = useMemo(() => {
    return channels.filter((ch) => {
      return channelFilterFn(ch, marshalConfig) && ch.ui_group === group.id;
    });
  }, [channels, group.id, marshalConfig]);

  // Create and mount the channel component if a channel is selected.
  // (replacing whatever was there before)
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (!currentChannel) return;
    if (!open) return;
    const channelIsInThisGroup = channelsInGroup.find(
      (ch) => ch.channel_code === currentChannel.channel_code,
    );
    if (!channelIsInThisGroup) return;

    selectedChannelElementRef.current = sdk.createChannelComponent(
      singleBffChannelToPublic(currentChannel, marshalConfig),
    );
    if (
      selectedChannelElementRef.current.parentElement !== containerRef.current
    ) {
      setContainerIsPopulated(true);
      containerRef.current.replaceChildren(selectedChannelElementRef.current);
    } else {
      // it's already in the right place, do nothing.
      // replaceChildren would cause iframes to reload even if we do a no-op update.
    }
  }, [channelsInGroup, currentChannel, marshalConfig, open, sdk]);

  // when the group is opened, if the currently selected channel is unset but the fakeDropdownSelection is set,
  // select that channel to sync this group's selection with the sdk state
  const previousOpen = usePrevious(open);
  useLayoutEffect(() => {
    if (open && !previousOpen) {
      // only run this when the group is opened
      if (currentChannel === null && fakeDropdownSelection !== null) {
        // restore the previous user selection
        const ch = channelsInGroup.find(
          (channel) => channel.channel_code === fakeDropdownSelection,
        );
        if (ch) {
          sdk.setCurrentChannel(singleBffChannelToPublic(ch, marshalConfig));
        }
      }
    }
  }, [
    channelsInGroup,
    currentChannel,
    fakeDropdownSelection,
    marshalConfig,
    open,
    previousOpen,
    sdk,
  ]);

  // Called on channel dropdown change
  const onSelectedChannelChange = useCallback(
    (dropdownOption: DropdownOption) => {
      const selected =
        channels.find(
          (channel) => channel.channel_code === dropdownOption.value,
        ) || null;

      // change both the local dropdown selection state and the sdk current channel
      setFakeDropdownSelection(selected?.channel_code ?? null);
      sdk.setCurrentChannel(
        selected ? singleBffChannelToPublic(selected, marshalConfig) : null,
      );
    },
    [channels, marshalConfig, sdk],
  );

  // Create channel options for dropdown
  const channelOptions = useMemo(() => {
    return channelsInGroup.map<DropdownOption>((channel) => ({
      leadingAsset: (
        <img
          className="xendit-channel-logo"
          src={channel.brand_logo_url}
          key={channel.channel_code}
        />
      ),
      title: channel.brand_name,
      value: channel.channel_code,
      disabled: !satisfiesMinMax(session, channel),
      description: getChannelDisabledReason(t, session, channel) || undefined,
    }));
  }, [channelsInGroup, session, t]);

  // Hide dropdown for cards channel
  const hideDropdown =
    channelsInGroup.length === 1 && channelsInGroup[0].channel_code === "CARDS";

  function dropdownSelectedIndex() {
    // find the selected index based on currentChannel, or fallback to fakeDropdownSelection
    const i1 = channelOptions.findIndex((channel) => {
      return channel.value === currentChannel?.channel_code;
    });
    if (i1 !== -1) return i1;
    const i2 = channelOptions.findIndex((channel) => {
      return channel.value === fakeDropdownSelection;
    });
    if (i2 !== -1) return i2;
    return -1;
  }

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
            selectedIndex={dropdownSelectedIndex()}
            options={channelOptions}
            onChange={onSelectedChannelChange}
            placeholder={t("payment_methods.select_channel_placeholder", {
              groupName: group.label,
              ns: "session",
            })}
          />
        </div>
      )}
      <div
        style={{ display: containerIsPopulated ? "" : "none" }}
        ref={containerRef}
      />
    </div>
  );
};

export function getChannelDisabledReason(
  t: TFunction<"session">,
  session: BffSession,
  channel: BffChannel,
): string | null {
  if (satisfiesMinMax(session, channel)) {
    return null;
  }

  if (channel.min_amount && session.amount < channel.min_amount) {
    return t("payment_methods.channel_disabled_amount_too_small");
  } else {
    return t("payment_methods.channel_disabled_amount_too_large");
  }
}
