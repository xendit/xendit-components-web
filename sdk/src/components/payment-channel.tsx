import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useEffect, useRef, useState } from "preact/hooks";
import { createContext, RefObject } from "preact";
import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { InstructionsIcon } from "./instructions-icon";
import { useSdk, useSession } from "./session-provider";
import { CheckboxField } from "./field-checkbox";

const ChannelContext = createContext<BffChannel | null>(null);

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error("useChannel must be used within a ChannelProvider");
  }
  return context;
};

interface Props {
  channels: BffChannel[];
  formRef?: RefObject<ChannelFormHandle>;
}

export const PaymentChannel: React.FC<Props> = (props) => {
  const { channels, formRef } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const sdk = useSdk();
  const { t } = sdk;
  const session = useSession();
  const [savePaymentMethod, setSavePaymentMethod] = useState(
    sdk.getSavePaymentMethod() ?? false,
  );
  // Default to first channel if no channels provided
  const defaultChannel = channels[0];

  // Find paired channel (different allow_save setting)
  const pairedChannel = channels.find(
    (c) =>
      c.allow_save !== defaultChannel.allow_save &&
      c.brand_name === defaultChannel.brand_name,
  );

  // State to track the active channel (original or paired)
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);

  const instructions = instructionsAsTuple(selectedChannel.instructions);

  const onChannelPropertiesChanged = (channelProperties: ChannelProperties) => {
    const event = new XenditChannelPropertiesChangedEvent(
      selectedChannel.channel_code,
      channelProperties,
    );
    divRef.current?.dispatchEvent(event);
  };

  const shouldShowSaveCheckbox =
    session.allow_save_payment_method === "OPTIONAL" &&
    (selectedChannel.allow_save || !!pairedChannel);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = (e.target as HTMLInputElement)?.checked;
    setSavePaymentMethod(checked);
    onSavePaymentMethodChanged?.(checked);
  };

  const onSavePaymentMethodChanged = (checked: boolean) => {
    let targetChannel = defaultChannel;
    if (pairedChannel) {
      if (checked && !defaultChannel.allow_save) {
        targetChannel = pairedChannel;
      }
    }

    divRef.current?.dispatchEvent(
      new XenditSavePaymentMethodChangedEvent(
        targetChannel.channel_code,
        checked,
      ),
    );

    setSelectedChannel(targetChannel);
  };

  useEffect(() => {
    if (
      sdk.getActiveChannel()?.channelCode === defaultChannel.channel_code &&
      selectedChannel.channel_code !== defaultChannel.channel_code &&
      savePaymentMethod
    ) {
      // Channel has already been swapped
      // Dispatch an event to update activeChannelCode for paired channel
      divRef.current?.dispatchEvent(
        new XenditSavePaymentMethodChangedEvent(
          selectedChannel.channel_code,
          true,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdk.getActiveChannel()?.channelCode]);

  return (
    <ChannelContext.Provider value={selectedChannel}>
      <div className="xendit-payment-channel" ref={divRef}>
        <ChannelForm
          ref={formRef}
          form={selectedChannel.form}
          onChannelPropertiesChanged={onChannelPropertiesChanged}
        />
        {shouldShowSaveCheckbox && (
          <CheckboxField
            label={t("payment.save_checkbox_label")}
            onChange={handleCheckboxChange}
          />
        )}
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
  channel: string;
  savePaymentMethod: boolean;

  constructor(channel: string, savePaymentMethod: boolean) {
    super(XenditSavePaymentMethodChangedEvent.type, {
      bubbles: true,
      composed: true,
    });
    this.channel = channel;
    this.savePaymentMethod = savePaymentMethod;
  }
}
