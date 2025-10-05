import { Channel, ChannelProperties } from "../forms-types";
import Icon from "./icon";
import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useRef } from "preact/hooks";
import { createContext, RefObject } from "preact";

const ChannelCardContext = createContext<Channel["card"] | null>(null);

export const useChannelCard = () => {
  const context = useContext(ChannelCardContext);
  if (context === undefined) {
    throw new Error("useChannelCard must be used within a ChannelCardProvider");
  }
  return context;
};

interface Props {
  channel: Channel;
  active: boolean;
  formRef?: RefObject<ChannelFormHandle>;
}

export const PaymentChannel: React.FC<Props> = (props) => {
  const { channel, formRef } = props;

  const divRef = useRef<HTMLDivElement>(null);

  const onChannelPropertiesChanged = (channelProperties: ChannelProperties) => {
    const event = new XenditChannelPropertiesChangedEvent(
      channel.channel_code,
      channelProperties,
    );
    divRef.current?.dispatchEvent(event);
  };

  return (
    <ChannelCardContext.Provider value={channel.card}>
      <div className="xendit-payment-channel" ref={divRef}>
        <ChannelForm
          ref={formRef}
          form={channel.form}
          onChannelPropertiesChanged={onChannelPropertiesChanged}
        />
        <div className="xendit-payment-channel-instructions">
          <Icon name="instructions" size={40} />
          <div className="xendit-payment-channel-instructions-text xendit-text-12">
            {channel.instructions.map((instr, i) => (
              <p
                key={i}
                className={i === 0 ? "xendit-text-semibold" : undefined}
              >
                {instr}
              </p>
            ))}
          </div>
        </div>
      </div>
    </ChannelCardContext.Provider>
  );
};

export class XenditChannelPropertiesChangedEvent extends Event {
  static readonly type = "xendit-channel-properties-changed" as const;
  channel: string;
  channelProperties: ChannelProperties;

  constructor(channel: string, channelProperties: ChannelProperties) {
    super(XenditChannelPropertiesChangedEvent.type, {
      bubbles: true,
      composed: true,
    });
    this.channel = channel;
    this.channelProperties = channelProperties;
  }
}
