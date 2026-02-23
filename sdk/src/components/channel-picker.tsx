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
import { assert, satisfiesMinMax } from "../utils";
import { BffSession } from "../backend-types/session";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { TFunction } from "i18next";
import {
  findChannelPairs,
  makeChannelsByGroupId,
  singleBffChannelToPublic,
} from "../bff-marshal";
import { ChannelPickerDigitalWalletSection } from "./channel-picker-digital-wallet-section";

type Props = object;

export const XenditChannelPicker: FunctionComponent<Props> = (props) => {
  const sdk = useSdk();
  const session = useSession();
  const channelUiGroups = useChannelUiGroups();
  const currentChannel = useCurrentChannel();
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

  // selected group is the containing group of the currently selected channel
  const selectedGroupId = currentChannel?.ui_group ?? null;

  // previewed group means expanded but no channel selected
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(null);

  const handleSelectChannelGroup = useCallback(
    (groupId: string) => {
      if (selectedGroupId === groupId || previewGroupId === groupId) {
        // user wants to collapse the group while a channel was selected, clear the channel selection
        if (selectedGroupId === groupId) {
          // clear actual selection
          thisRef.current?.dispatchEvent(
            new XenditClearCurrentChannelEvent(groupId),
          );
        }
        if (previewGroupId === groupId) {
          // clear previewed state
          setPreviewGroupId(null);
        }
      } else {
        // user wants to open a different group
        // if the new group has one channel, select it automatically
        // otherwise set it as previewed
        const newGroup = channelUiGroups.find((g) => g.id === groupId);
        assert(newGroup);
        const enabledChannels = groupEnabledChannelStats(
          session,
          newGroup,
          channels,
          t,
        ).enabledChannels;
        if (enabledChannels === 0) {
          // no enabled channels, do nothing
          return;
        } else if (enabledChannels === 1) {
          // one enabled channel, select it automatically
          const ch = channelsByGroup[groupId][0];
          sdk.setCurrentChannel(singleBffChannelToPublic(ch, marshalConfig));
          setPreviewGroupId(null);
        } else {
          // multiple enabled channels, set as previewed and clear the channel selection
          setPreviewGroupId(groupId);
          sdk.setCurrentChannel(null);
        }
      }
    },
    [
      channelUiGroups,
      channels,
      channelsByGroup,
      marshalConfig,
      previewGroupId,
      sdk,
      selectedGroupId,
      session,
      t,
    ],
  );

  // once a channel is selected, remove previewGroupId.
  // (without this, the group would continue showing the old selected channel after the selection is cleared using setCurrentChannel(null))
  useLayoutEffect(() => {
    if (currentChannel !== null && previewGroupId !== null) {
      setPreviewGroupId(null);
    }
  }, [currentChannel, previewGroupId]);

  if (sdk.getSdkStatus() !== "ACTIVE" || session.status !== "ACTIVE") {
    // clear all contents if the sdk is not initialized or crashes, or if the component is still mounted after completion or failure
    return null;
  }

  const digitalWalletSectionEnabled = false;

  return (
    <div ref={thisRef}>
      {digitalWalletSectionEnabled ? (
        <ChannelPickerDigitalWalletSection />
      ) : null}
      <Accordion>
        {channelUiGroups
          .filter((group) => {
            // remove empty groups
            return (channelsByGroup[group.id] || []).length > 0;
          })
          .map((group) => {
            // make the group open if it is selected or previewed
            const open =
              selectedGroupId !== null
                ? selectedGroupId === group.id
                : previewGroupId === group.id;

            // make the group disabled if it has no enabled channels
            const enabledChannelsStats = groupEnabledChannelStats(
              session,
              group,
              channels,
              t,
            );
            const disabled = enabledChannelsStats.enabledChannels === 0;
            const disabledReason =
              enabledChannelsStats.firstDisabledChannelReason;

            return (
              <AccordionItem
                key={group.id}
                id={group.id}
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
function groupEnabledChannelStats(
  session: BffSession,
  group: BffChannelUiGroup,
  channels: BffChannel[],
  t: TFunction<"session">,
): {
  enabledChannels: number;
  firstDisabledChannelReason: string | null;
} {
  let firstDisabledChannelReason = null;
  let enabledChannels = 0;
  for (const channel of channels) {
    if (channel.ui_group !== group.id) continue;
    if (satisfiesMinMax(session, channel)) {
      enabledChannels++;
      continue;
    }
    if (firstDisabledChannelReason === null) {
      firstDisabledChannelReason = getChannelDisabledReason(
        t,
        session,
        channel,
      );
    }
  }
  return {
    enabledChannels,
    firstDisabledChannelReason,
  };
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
