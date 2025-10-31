import React, { useCallback, useLayoutEffect } from "react";
import { Accordion } from "./accordion";
import { AccordionItem } from "./accordion-item";
import {
  useActiveChannel,
  useChannelUiGroups,
  useSession,
} from "./session-provider";
import { ChannelPickerGroup } from "./channel-picker-group";
import { usePrevious } from "../utils";

type Props = object;

export const XenditChannelPicker: React.FC<Props> = (props) => {
  const session = useSession();
  const channelUiGroups = useChannelUiGroups();
  const activeChannel = useActiveChannel();

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
          new XenditClearActiveChannelEvent(groupId),
        );
        setSelectedGroup(null);
      } else {
        setSelectedGroup(i);
      }
      setSelectedGroupWasTriggeredManually(true);
    },
    [channelUiGroups, selectedGroup],
  );

  const previousActiveChannel = usePrevious(activeChannel);
  useLayoutEffect(() => {
    if (
      activeChannel !== previousActiveChannel &&
      !selectedGroupWasTriggeredManually
    ) {
      // only run this when the active channel AND active group changes
      if (activeChannel === null) {
        // collapse the selected group when the active channel is cleared
        setSelectedGroup(null);
      } else {
        // expand the group of the newly selected channel
        const groupIndex = channelUiGroups.findIndex(
          (group) => activeChannel.ui_group === group.id,
        );
        if (groupIndex !== -1) {
          setSelectedGroup(groupIndex);
        }
      }
    }
    setSelectedGroupWasTriggeredManually(false);
  }, [
    activeChannel,
    channelUiGroups,
    previousActiveChannel,
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

export class XenditClearActiveChannelEvent extends Event {
  static readonly type = "xendit-clear-active-channel" as const;
  uiGroup: string;

  constructor(uiGroup: string) {
    super(XenditClearActiveChannelEvent.type, {
      bubbles: true,
      composed: true,
    });
    this.uiGroup = uiGroup;
  }
}
