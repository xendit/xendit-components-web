import {
  useCurrentChannel,
  useChannels,
  useSdk,
  useSession,
} from "./session-provider";
import { BffChannelUiGroup } from "../backend-types/channel";
import { assert, usePrevious } from "../utils";
import { useLayoutEffect, useMemo, useRef } from "preact/hooks";
import { channelFilterFn, findChannelPairs } from "../bff-marshal";
import { FunctionComponent } from "preact";
import { GraphicQrScan } from "./graphic-qr-scan";

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

  // create action container
  const previousOpen = usePrevious(open);
  useLayoutEffect(() => {
    if (channelsInGroup.length !== 1) {
      // should never happen
      return;
    }

    if (open && !previousOpen) {
      // create a new action container if we didn't already
      if (!actionContinerRef.current) {
        actionContinerRef.current = sdk.createActionContainerComponent();
      }
      actionContinerContainerRef.current?.replaceChildren(
        actionContinerRef.current,
      );
    }

    if (!open) {
      // destroy action container if this group is no longer open or another channel was selected
      if (actionContinerRef.current) {
        sdk.forgetComponent(actionContinerRef.current);
        actionContinerRef.current = null;
      }
    }
  }, [channelsInGroup, currentChannel?.channel_code, open, previousOpen, sdk]);

  return (
    <div className="xendit-channel-picker-group xendit-channel-picker-oneclick-group">
      <div
        className="xendit-channel-picker-oneclick-action-container"
        ref={actionContinerContainerRef}
      ></div>
      <GraphicQrScan className="xendit-channel-picker-oneclick-pending-graphic" />
    </div>
  );
};
