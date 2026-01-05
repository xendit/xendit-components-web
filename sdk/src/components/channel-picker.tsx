import React, { useCallback, useLayoutEffect } from "react";
import { Accordion } from "./accordion";
import { AccordionItem } from "./accordion-item";
import {
  useCurrentChannel,
  useChannelUiGroups,
  useSession,
} from "./session-provider";
import { ChannelPickerGroup } from "./channel-picker-group";
import { usePrevious } from "../utils";

type Props = object;

export const XenditChannelPicker: React.FC<Props> = (props) => {
  const session = useSession();
  const channelUiGroups = useChannelUiGroups();
  const currentChannel = useCurrentChannel().channel;

  const thisRef = React.useRef<HTMLDivElement>(null);

  const [selectedGroup, setSelectedGroup] = React.useState<number | null>(null);
  const [
    selectedGroupWasTriggeredManually,
    setSelectedGroupWasTriggeredManually,
  ] = React.useState<boolean>(false);

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

  if (session.status !== "ACTIVE") {
    // users are allowed to create channel pickers before loading the session, but we
    // shouldn't render anything if after it loads, it isn't active
    return null;
  }

  return (
    // FIXME: make it work without this extra div
    <div ref={thisRef}>
      <Accordion>
        {channelUiGroups.map((group, i) => {
          const open = selectedGroup === i;
          return (
            <AccordionItem
              key={i}
              id={i}
              title={group.label}
              open={open}
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
