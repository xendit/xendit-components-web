import React, { useCallback } from "react";
import { Accordion } from "./accordion";
import { AccordionItem } from "./accordion-item";
import { useChannelUiGroups } from "./session-provider";
import { ChannelPickerGroup } from "./channel-picker-group";

interface Props {}

export const XenditChannelPicker: React.FC<Props> = (props) => {
  const channelUiGroups = useChannelUiGroups();

  const thisRef = React.useRef<HTMLDivElement>(null);
  const [selectedGroup, setSelectedGroup] = React.useState<number | null>(null);

  const handleSelectChannelGroup = useCallback(
    (i: number) => {
      if (selectedGroup === i) {
        const groupId = channelUiGroups[i].id;
        // this clears the selected channel if it belongs to this group
        thisRef.current?.dispatchEvent(
          new XenditClearActiveChannelEvent(groupId)
        );
        setSelectedGroup(null);
      } else {
        setSelectedGroup(i);
      }
    },
    [channelUiGroups, selectedGroup]
  );

  if (!channelUiGroups) return null;

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
      composed: true
    });
    this.uiGroup = uiGroup;
  }
}
