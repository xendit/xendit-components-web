import { Accordion } from "./core/accordion";
import { AccordionItem } from "./core/accordion-item";
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
import { assert, satisfiesMinMax, usePrevious } from "../utils";
import { BffSession } from "../backend-types/session";
import { BffChannel, BffChannelUiGroup } from "../backend-types/channel";
import { TFunction } from "../localization";
import {
  findChannelPairs,
  getChannelCodesForTelemetry,
  makeChannelsByGroupId,
  singleBffChannelToPublic,
} from "../bff-marshal";
import { ChannelPickerDigitalWalletSection } from "./channel-picker-digital-wallet-section";
import { getTelemetry, SessionTelemetryScope } from "../telemetry";
import { TelemetryEvents } from "../telemetry-events";
import { ChannelPickerOneclick } from "./channel-picker-oneclick";

type Props = {
  enableOneClickQr: boolean;
};

export const ChannelPickerRoot: FunctionComponent<Props> = (props) => {
  const { enableOneClickQr } = props;
  const sdk = useSdk();
  const telemetry = getTelemetry(sdk);
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

  const instantOpen = useMemo(
    () => instantOpenConfig(session, channelsByGroup, currentChannel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // selected group is the containing group of the currently selected channel
  const selectedGroupId = currentChannel?.ui_group ?? null;

  // previewed group means expanded but no channel selected
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(
    instantOpen?.group ?? null,
  );

  const telemetryScopeForGroup = useRef<SessionTelemetryScope | null>(null);
  const telemetryForGroupClear = useCallback(() => {
    if (telemetryScopeForGroup.current) {
      telemetry.popScope(telemetryScopeForGroup.current);
      telemetryScopeForGroup.current = null;
    }
  }, [telemetry]);
  const telemetryForGroupChange = useCallback(
    (groupName: string, groupId: string) => {
      telemetryForGroupClear();
      const channelList = getChannelCodesForTelemetry(
        session,
        channels,
        groupId,
      );
      telemetryScopeForGroup.current = telemetry.appendAndPushScope(
        TelemetryEvents.ChannelGroup(true, groupName, channelList),
      );
    },
    [telemetry, telemetryForGroupClear, session, channels],
  );

  const handleSelectChannelGroup = useCallback(
    (groupId: string) => {
      if (selectedGroupId === groupId || previewGroupId === groupId) {
        // user wants to collapse the group while a channel was selected, clear the channel selection
        if (selectedGroupId === groupId) {
          // clear actual selection
          thisRef.current?.dispatchEvent(
            new XenditClearCurrentChannelEvent(groupId),
          );
          telemetryForGroupClear();
        }
        if (previewGroupId === groupId) {
          // clear previewed state
          setPreviewGroupId(null);
          telemetryForGroupClear();
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
          telemetryForGroupChange(newGroup.label, groupId);
          sdk.setCurrentChannel(singleBffChannelToPublic(ch, marshalConfig));
          setPreviewGroupId(null);
        } else {
          // multiple enabled channels, set as previewed (group displayed but no channel selected)
          telemetryForGroupChange(newGroup.label, groupId);
          sdk.setCurrentChannel(null);
          setPreviewGroupId(groupId);
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
      telemetryForGroupChange,
      telemetryForGroupClear,
    ],
  );

  // once a channel is selected, remove previewGroupId.
  // (without this, the group would continue showing the old selected channel after the selection is cleared using setCurrentChannel(null))
  useLayoutEffect(() => {
    if (currentChannel !== null && previewGroupId !== null) {
      setPreviewGroupId(null);
    }
  }, [currentChannel, previewGroupId]);

  const openGroupId = selectedGroupId ?? previewGroupId;
  const isOneClick =
    openGroupId !== null &&
    enableOneClickQr &&
    enableOneclickForGroup(session, channelsByGroup[openGroupId]);

  // if a preview group is alrady set on the first render, fire telemetry for it
  useLayoutEffect(() => {
    if (previewGroupId) {
      const group = channelUiGroups.find(
        (group) => group.id === previewGroupId,
      )!;
      telemetryForGroupChange(group.label, group.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // select the instantOpen channel if any (first render only)
  useLayoutEffect(() => {
    if (currentChannel === null && instantOpen?.channel && !isOneClick) {
      // Select the channel on the next tick. This isn't ideal, I'd like to select it on the current tick but that's not safe, it will recursively render.
      setTimeout(() => {
        sdk.setCurrentChannel(
          singleBffChannelToPublic(instantOpen.channel, marshalConfig),
        );
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // did this render trigger a oneclick group to open? if so begin oneclick flow
  const previousIsOneClick = usePrevious(isOneClick);
  useLayoutEffect(() => {
    if (!(isOneClick && !previousIsOneClick)) return;

    setTimeout(() => {
      // make channel object
      const ch = singleBffChannelToPublic(
        channelsByGroup[openGroupId][0],
        marshalConfig,
      );
      // select channel
      sdk.setCurrentChannel(ch);

      // do submission
      try {
        sdk.submitOneclick();
      } catch (_e) {
        // dont care
      }
    }, 0);
  }, [
    channelsByGroup,
    isOneClick,
    marshalConfig,
    openGroupId,
    previousIsOneClick,
    sdk,
  ]);

  return (
    <div ref={thisRef}>
      <ChannelPickerDigitalWalletSection />
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

            const channelLogos = resolveChannelLogosForGroup(
              session,
              channelsByGroup[group.id],
            );

            const enableOneclick =
              enableOneClickQr &&
              enableOneclickForGroup(session, channelsByGroup[group.id]);

            return (
              <AccordionItem
                key={group.id}
                id={group.id}
                title={group.label}
                subtitle={disabledReason ?? undefined}
                open={open}
                disabled={disabled}
                onClick={handleSelectChannelGroup}
                channelLogos={channelLogos}
              >
                {enableOneclick ? (
                  <ChannelPickerOneclick group={group} open={open} />
                ) : (
                  <ChannelPickerGroup group={group} open={open} />
                )}
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
  t: TFunction,
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

function resolveChannelLogosForGroup(
  session: BffSession,
  channels: BffChannel[],
): { src: string; alt: string; enabled: boolean }[] {
  const logos: { src: string; alt: string; enabled: boolean }[] = [];
  for (const channel of channels) {
    const enabled = satisfiesMinMax(session, channel);
    if (channel.card) {
      // use generic card icon
      logos.push({
        src: "https://assets.xendit.co/payment-session/logos/CARDS.svg",
        alt: channel.brand_name,
        enabled,
      });
    } else {
      // else use channel brand logo
      logos.push({
        src: channel.brand_logo_url,
        alt: channel.brand_name,
        enabled,
      });
    }
  }
  return logos;
}

function enableOneclickForGroup(session: BffSession, channels: BffChannel[]) {
  return (
    channels.length === 1 &&
    channels[0].pm_type === "QR_CODE" &&
    channels[0].form.length === 0
  );
}

// we auto-open a group if there's only one and at least one channel is selectable, and auto-select a channel if there's only one.
function instantOpenConfig(
  session: BffSession,
  channelsByGroup: Record<string, BffChannel[]>,
  currentChannel: BffChannel | null,
) {
  if (currentChannel) {
    return null; // channel already selected, unlikely to happen but lets just do nothing here
  }

  const channels = Object.values(channelsByGroup);
  if (channels.length !== 1) {
    return null; // must have exactly one group
  }

  if (channels[0].length === 0) {
    return null; // no channels, should never happen
  }

  if (!channels[0].some((channel) => satisfiesMinMax(session, channel))) {
    return null; // all channels in group are unselectable
  }

  if (channels[0].length !== 1) {
    return { group: channels[0][0].ui_group }; // group is auto-opened but channel is not
  }

  return { group: channels[0][0].ui_group, channel: channels[0][0] }; // group and channel are auto selectable
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
