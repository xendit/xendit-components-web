import { Accordion } from "./accordion";
import { AccordionItem } from "./accordion-item";
import {
  useCurrentChannel,
  useChannelUiGroups,
  useSession,
  useChannels,
  useSdk,
} from "./session-provider";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FunctionComponent } from "preact";
import {
  ChannelPickerGroup,
  getChannelDisabledReason,
} from "./channel-picker-group";
import { satisfiesMinMax, usePrevious } from "../utils";
import { BffSession } from "../backend-types/session";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { TFunction } from "i18next";
import { findChannelPairs, makeChannelsByGroupId } from "../bff-marshal";

type Props = object;

export const XenditChannelPicker: FunctionComponent<Props> = (props) => {
  const sdk = useSdk();
  const session = useSession();
  const channelUiGroups = useChannelUiGroups();
  const currentChannel = useCurrentChannel().channel;
  const channels = useChannels();
  const { t } = useSdk();

  const channelsByGroup = useMemo(() => {
    return makeChannelsByGroupId(channels, {
      options: { filterMinMax: false },
      pairChannels: findChannelPairs(channels),
      session,
    });
  }, [channels, session]);

  const thisRef = useRef<HTMLDivElement>(null);

  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [
    selectedGroupWasTriggeredManually,
    setSelectedGroupWasTriggeredManually,
  ] = useState<boolean>(false);

  const handleSelectChannelGroup = useCallback(
    (i: number) => {
      if (selectedGroup === i) {
        const groupId = channelUiGroups[i].id;
        // this clears the selected channel if it belongs to this group
        thisRef.current?.dispatchEvent(
          new XenditClearCurrentChannelEvent(groupId),
        );
        setSelectedGroup(null);
      } else {
        setSelectedGroup(i);
      }
      setSelectedGroupWasTriggeredManually(true);
    },
    [channelUiGroups, selectedGroup],
  );

  const previousCurrentChannel = usePrevious(currentChannel);
  useLayoutEffect(() => {
    if (
      currentChannel !== previousCurrentChannel &&
      !selectedGroupWasTriggeredManually
    ) {
      // only run this when the current channel AND current group changes
      if (currentChannel === null) {
        // collapse the selected group when the current channel is cleared
        setSelectedGroup(null);
      } else {
        // expand the group of the newly selected channel
        const groupIndex = channelUiGroups.findIndex(
          (group) => currentChannel.ui_group === group.id,
        );
        if (groupIndex !== -1) {
          setSelectedGroup(groupIndex);
        }
      }
    }
    setSelectedGroupWasTriggeredManually(false);
  }, [
    currentChannel,
    channelUiGroups,
    previousCurrentChannel,
    selectedGroup,
    selectedGroupWasTriggeredManually,
  ]);

  if (sdk.getSdkStatus() !== "ACTIVE" || session.status !== "ACTIVE") {
    // clear all contents if the sdk is not initialized or crashes, or if the component is still mounted after completion or failure
    return null;
  }

  return (
    // FIXME: make it work without this extra div
    <div ref={thisRef}>
      <Accordion>
        {channelUiGroups
          .filter((group) => {
            // remove empty groups
            return (channelsByGroup[group.id] || []).length > 0;
          })
          .map((group, i) => {
            const open = selectedGroup === i;
            // make the group disabled if it has no enabled channels
            const disabledReason = groupHasNoEnabledChannel(
              session,
              group,
              channels,
              t,
            );
            const disabled = disabledReason !== null;
            return (
              <AccordionItem
                key={i}
                id={i}
                title={group.label}
                subtitle={disabledReason ?? undefined}
                open={open}
                disabled={disabled}
                onClick={handleSelectChannelGroup}
              >
                <ChannelPickerGroup group={group} open={open} />
              </AccordionItem>
            );
          })}
      </Accordion>
    </div>
  );
};

// returns null if the group has any enabled channels, otherwise returns the disabled reason as a string
function groupHasNoEnabledChannel(
  session: BffSession,
  group: BffChannelUiGroup,
  channels: BffChannel[],
  t: TFunction<"session">,
): string | null {
  let lastReason = null;
  for (const channel of channels) {
    if (channel.ui_group !== group.id) continue;
    if (satisfiesMinMax(session, channel)) {
      return null;
    }
    lastReason = getChannelDisabledReason(t, session, channel);
  }
  return lastReason;
}

export class XenditClearCurrentChannelEvent extends Event {
  static readonly type = "xendit-clear-current-channel" as const;
  uiGroup: string;

  constructor(uiGroup: string) {
    super(XenditClearCurrentChannelEvent.type, {
      bubbles: true,
      composed: true,
    });
    this.uiGroup = uiGroup;
  }
}
