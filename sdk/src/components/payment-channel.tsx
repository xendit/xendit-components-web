import { Channel, ChannelProperties } from "../forms-types";
import Icon from "./icon";
import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useRef } from "preact/hooks";
import { createContext, RefObject } from "preact";

const ChannelContext = createContext<Channel | null>(null);

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error("useChannel must be used within a ChannelProvider");
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
    <ChannelContext.Provider value={channel}>
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
    </ChannelContext.Provider>
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
