import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useRef } from "preact/hooks";
import {
  createContext,
  FunctionComponent,
  RefObject,
  TargetedEvent,
} from "preact";
import { BffChannel, ChannelProperties } from "../backend-types/channel";
import { InstructionsIcon } from "./instructions-icon";
import { useSdk, useSession } from "./session-provider";
import { Checkbox } from "./checkbox";
import { resolvePairedChannel } from "../utils";

const ChannelContext = createContext<BffChannel | null>(null);

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error("useChannel must be used within a ChannelProvider");
  }
  return context;
};

interface Props {
  /** The channels to use. If this has two items then the first is the non-save channel and the second is the save version. */
  channels: BffChannel[];
  savePaymentMethod: boolean;
  formRef: RefObject<ChannelFormHandle>;
}

export const PaymentChannel: FunctionComponent<Props> = (props) => {
  const { channels, savePaymentMethod, formRef } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const sdk = useSdk();
  const { t } = sdk;
  const session = useSession();

  // events always use channels[0] because the CachedChannelComponents are keyed by that
  const firstMemberChannel = channels[0];

  const hasPairedChannel = channels.length > 1;
  const resolvedChannel = resolvePairedChannel(channels, savePaymentMethod);

  const instructions = instructionsAsTuple(resolvedChannel.instructions);

  const onChannelPropertiesChanged = (channelProperties: ChannelProperties) => {
    const event = new XenditChannelPropertiesChangedEvent(
      firstMemberChannel.channel_code,
      channelProperties,
    );
    divRef.current?.dispatchEvent(event);
  };

  const shouldShowSaveCheckbox =
    session.allow_save_payment_method === "OPTIONAL" &&
    (resolvedChannel.allow_save || hasPairedChannel);

  const handleCheckboxChange = (e: TargetedEvent<HTMLInputElement>) => {
    const checked = (e.target as HTMLInputElement)?.checked;
    divRef.current?.dispatchEvent(
      new XenditSavePaymentMethodChangedEvent(
        firstMemberChannel.channel_code,
        checked,
      ),
    );
  };

  return (
    <ChannelContext.Provider value={resolvedChannel}>
      <div className="xendit-payment-channel" ref={divRef}>
        <ChannelForm
          ref={formRef}
          form={resolvedChannel.form}
          onChannelPropertiesChanged={onChannelPropertiesChanged}
        />
        {shouldShowSaveCheckbox && (
          <Checkbox
            label={t("payment.save_checkbox_label")}
            onChange={handleCheckboxChange}
            checked={savePaymentMethod}
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
