import {
  useCurrentChannel,
  useChannels,
  useSdk,
  useSession,
} from "./session-provider";
import { BffChannelUiGroup } from "../backend-types/channel";
import { assert } from "../utils";
import { useLayoutEffect, useMemo, useRef } from "preact/hooks";
import {
  channelFilterFn,
  findChannelPairs,
  singleBffChannelToPublic,
} from "../bff-marshal";
import { FunctionComponent } from "preact";

interface ChannelPickerOneclickProps {
  group: BffChannelUiGroup;
  open: boolean;
}

export const ChannelPickerOneclick: FunctionComponent<
  ChannelPickerOneclickProps
> = (props) => {
  const { group, open } = props;

  const sdk = useSdk();
  const session = useSession();
  const channels = useChannels();

  const currentChannel = useCurrentChannel();

  const actionContinerRef = useRef<HTMLElement>(null);
  const actionContinerContainerRef = useRef<HTMLDivElement>(null);

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
  assert(channelsInGroup.length === 1);

  // select the channel on open
  useLayoutEffect(() => {
    if (open && !currentChannel) {
      // make channel object
      const ch = singleBffChannelToPublic(channelsInGroup[0], marshalConfig);

      // select channel
      sdk.setCurrentChannel(ch);
    }
  }, [channelsInGroup, currentChannel, marshalConfig, open, sdk]);

  // create action container and submit
  useLayoutEffect(() => {
    if (
      open &&
      currentChannel &&
      currentChannel.channel_code === channelsInGroup[0].channel_code
    ) {
      // create a new action container if we didn't already
      if (!actionContinerRef.current) {
        actionContinerRef.current = sdk.createActionContainerComponent();
        actionContinerContainerRef.current?.replaceChildren(
          actionContinerRef.current,
        );
      }

      // do submission
      try {
        sdk.submitOneclick();
      } catch (_e) {
        // dont care
      }
    } else {
      // destroy action container if this group is no longer open or another channel was selected
      if (actionContinerRef.current) {
        sdk.forgetComponent(actionContinerRef.current);
        actionContinerRef.current = null;
      }
    }
  }, [channelsInGroup, currentChannel, open, sdk]);

  // destroy action container on unmount
  useLayoutEffect(() => {
    return () => {
      if (actionContinerRef.current) {
        sdk.forgetComponent(actionContinerRef.current);
        actionContinerRef.current = null;
      }
    };
  }, [sdk]);

  return (
    <div className="xendit-channel-picker-group">
      <div
        className="xendit-channel-picker-oneclick-action-container"
        ref={actionContinerContainerRef}
      ></div>
    </div>
  );
};
