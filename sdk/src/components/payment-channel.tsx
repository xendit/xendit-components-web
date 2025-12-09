import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useRef, useState, useEffect } from "preact/hooks";
import { createContext, RefObject } from "preact";
import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { InstructionsIcon } from "./instructions-icon";
import { useSdk } from "./session-provider";

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
  formRef?: RefObject<ChannelFormHandle>;
  pairedChannel?: BffChannel;
}

export const PaymentChannel: React.FC<Props> = (props) => {
  const { channel, formRef, pairedChannel } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const sdk = useSdk();

  // State to track save payment method preference
  const [savePaymentMethod, setSavePaymentMethod] = useState<
    boolean | undefined
  >(sdk.getSavePaymentMethod());

  // State to track the active channel (original or paired)
  const [activeChannel, setActiveChannel] = useState<BffChannel>(channel);

  // Effect to listen for save payment method changes
  useEffect(() => {
    const handleSavePaymentMethodChanged = (event: Event) => {
      if (event instanceof XenditSavePaymentMethodChangedEvent) {
        setSavePaymentMethod(event.savePaymentMethod);
      }
    };

    const currentDiv = divRef.current;

    currentDiv?.addEventListener(
      XenditSavePaymentMethodChangedEvent.type,
      handleSavePaymentMethodChanged,
    );

    return () => {
      currentDiv?.removeEventListener(
        XenditSavePaymentMethodChangedEvent.type,
        handleSavePaymentMethodChanged,
      );
    };
  }, []);

  // Effect to switch between original channel and pairedChannel based on savePaymentMethod
  useEffect(() => {
    if (savePaymentMethod && pairedChannel) {
      setActiveChannel(pairedChannel);
    } else {
      setActiveChannel(channel);
    }
  }, [savePaymentMethod, channel, pairedChannel]);
  const instructions = instructionsAsTuple(activeChannel.instructions);

  const onChannelPropertiesChanged = (channelProperties: ChannelProperties) => {
    const event = new XenditChannelPropertiesChangedEvent(
      activeChannel.channel_code,
      channelProperties,
    );
    divRef.current?.dispatchEvent(event);
  };

  return (
    <ChannelContext.Provider value={activeChannel}>
      <div className="xendit-payment-channel" ref={divRef}>
        <ChannelForm
          ref={formRef}
          form={activeChannel.form}
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

export class XenditSavePaymentMethodChangedEvent extends Event {
  static readonly type = "xendit-save-payment-method-changed" as const;
  savePaymentMethod: boolean;

  constructor(savePaymentMethod: boolean) {
    super(XenditSavePaymentMethodChangedEvent.type, {
      bubbles: true,
      composed: true,
    });
    this.savePaymentMethod = savePaymentMethod;
  }
}
