import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useRef } from "preact/hooks";
import { createContext, RefObject } from "preact";
import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { InstructionsIcon } from "./instructions-icon";

const ChannelContext = createContext<BffChannel | null>(null);

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error("useChannel must be used within a ChannelProvider");
  }
  return context;
};

interface Props {
  channel: BffChannel;
  active: boolean;
  formRef?: RefObject<ChannelFormHandle>;
}

export const PaymentChannel: React.FC<Props> = (props) => {
  const { channel, formRef } = props;

  const divRef = useRef<HTMLDivElement>(null);

  const instructions = instructionsAsTuple(channel.instructions);

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
        {instructions ? (
          <div className="xendit-payment-channel-instructions">
            <InstructionsIcon />
            <div className="xendit-payment-channel-instructions-text xendit-text-12">
              {instructions.map((instr, i) => (
                <p
                  key={i}
                  className={i === 0 ? "xendit-text-semibold" : undefined}
                >
                  {instr}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ChannelContext.Provider>
  );
};

function instructionsAsTuple(
  instructions: string[] | undefined,
): [string, string] | null {
  if (instructions && instructions.length === 2) {
    return [instructions[0], instructions[1]] as const;
  }
  return null;
}

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
