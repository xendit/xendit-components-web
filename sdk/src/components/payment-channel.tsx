import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useCallback, useContext, useRef } from "preact/hooks";
import { createContext, RefObject } from "preact";
import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { InstructionsIcon } from "./instructions-icon";
import { useSession, useSdk } from "./session-provider";
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
  channel: BffChannel;
  formRef?: RefObject<ChannelFormHandle>;
}

export const PaymentChannel: React.FC<Props> = (props) => {
  const { channel, formRef } = props;
  const session = useSession();
  const sdk = useSdk();
  const { t } = sdk;
  const divRef = useRef<HTMLDivElement>(null);

  const instructions = instructionsAsTuple(channel.instructions);

  const onChannelPropertiesChanged = (channelProperties: ChannelProperties) => {
    const event = new XenditChannelPropertiesChangedEvent(
      channel.channel_code,
      channelProperties,
    );
    divRef.current?.dispatchEvent(event);
  };

  // Determine if save payment method checkbox should be shown
  const shouldShowSaveCheckbox =
    session.allow_save_payment_method !== "DISABLED" &&
    channel?.allow_save === true;

  // Handler for save payment method checkbox
  const handleSavePaymentMethodChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const checked = (e.target as HTMLInputElement)?.checked;
      sdk.setSavePaymentMethod(checked);
    },
    [sdk],
  );

  return (
    <ChannelContext.Provider value={channel}>
      <div className="xendit-payment-channel" ref={divRef}>
        <ChannelForm
          ref={formRef}
          form={channel.form}
          onChannelPropertiesChanged={onChannelPropertiesChanged}
        />
        {shouldShowSaveCheckbox && (
          <CheckboxField
            id="save-payment-method"
            label={t("payment.save_checkbox_label")}
            defaultChecked={sdk.getSavePaymentMethod()}
            onChange={handleSavePaymentMethodChange}
            disabled={session.allow_save_payment_method === "FORCED"}
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
