import React, { useContext, useCallback } from "react";
import { Channel } from "../forms-types";
import { Accordion } from "./accordion";
import { AccordionItem } from "./accordion-item";
import { useChannels, useChannelUiGroups } from "./session-provider";
import { ChannelPickerGroup } from "./channel-picker-group";

interface Props {
  onChannelPicked: (channel: Channel, channelElement: HTMLElement) => void;
}

export const XenditChannelPicker: React.FC<Props> = ({ onChannelPicked }) => {
  const channelUiGroups = useChannelUiGroups();
  const channels = useChannels();

  const handleSelectChannelGroup = useCallback(
    (index: number) => {
      if (!channelUiGroups || !channels) return;

      const group = channelUiGroups[index];
      if (!group) return;

      const channelsInGroup = channels.filter(
        (method) => method.ui_group === group.id
      );

      if (channelsInGroup.length === 1) {
        const channel = channelsInGroup[0];
        onChannelPicked(channel, document.createElement("div"));
      }
    },
    [channelUiGroups, channels, onChannelPicked]
  );

  if (!channelUiGroups) return null;

  return (
    <Accordion>
      {channelUiGroups.map((group, i) => (
        <AccordionItem
          key={i}
          title={group.label}
          onClick={() => handleSelectChannelGroup(i)}
        >
          <ChannelPickerGroup group={group} />
        </AccordionItem>
      ))}
    </Accordion>
  );
};
