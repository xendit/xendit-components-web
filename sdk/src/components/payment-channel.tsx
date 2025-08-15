import { Channel, ChannelProperties } from "../forms-types";
import Icon from "./icon";
import ChannelForm from "./channel-form";
import { useRef } from "preact/hooks";

interface Props {
  channel: Channel;
  active: boolean;
}

export const PaymentChannel: React.FC<Props> = (props, formRef) => {
  const { channel } = props;

  const ref = useRef<HTMLDivElement>(null);

  const onChannelPropertiesChanged = (channelProperties: ChannelProperties) => {
    const event = new XenditChannelPropertiesChangedEvent(
      channel.channel_code,
      channelProperties,
    );
    ref.current?.dispatchEvent(event);
  };

  return (
    <div className="xendit-payment-channel" ref={ref}>
      <ChannelForm
        form={channel.form}
        onChannelPropertiesChanged={onChannelPropertiesChanged}
      />
      <div className="xendit-payment-channel-instructions">
        <Icon name="instructions" size={40} />
        <div className="xendit-payment-channel-instructions-text xendit-text-12">
          {channel.instructions.map((instr, i) => (
            <p key={i} className={i === 0 ? "xendit-text-semibold" : undefined}>
              {instr}
            </p>
          ))}
        </div>
      </div>
    </div>
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
