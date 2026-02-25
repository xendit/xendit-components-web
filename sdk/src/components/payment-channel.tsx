import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useRef } from "preact/hooks";
import {
  createContext,
  FunctionComponent,
  RefObject,
  TargetedEvent,
} from "preact";
import {
  BffChannel,
  BffChannelBanner,
  ChannelProperties,
} from "../backend-types/channel";
import { InstructionsIcon } from "./instructions-icon";
import { useSdk, useSession } from "./session-provider";
import { Checkbox } from "./checkbox";
import { resolvePairedChannel } from "../utils";
import { ChannelComponentData } from "../public-sdk";
import { InternalUpdateChannelComponentData } from "../private-event-types";

const ChannelContext = createContext<BffChannel | null>(null);

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (context === undefined) {
    throw new Error("useChannel must be used within a ChannelProvider");
  }
  return context;
};

const ChannelComponentDataContext = createContext<ChannelComponentData | null>(
  null,
);
ChannelComponentDataContext.displayName = "ChannelComponentDataContext";

export const useChannelComponentData = () => {
  const context = useContext(ChannelComponentDataContext);
  return context;
};

interface Props {
  /** The channels to use. If this has two items then the first is the non-save channel and the second is the save version. */
  channelOrPair: BffChannel[];
  channelData: ChannelComponentData;
  savePaymentMethod: boolean;
  formRef: RefObject<ChannelFormHandle>;
}

export const PaymentChannel: FunctionComponent<Props> = (props) => {
  const { channelOrPair, channelData, savePaymentMethod, formRef } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const sdk = useSdk();
  const { t } = sdk;
  const session = useSession();

  // events always use channelOrPair[0] because the CachedChannelComponents are keyed by that
  const firstMemberChannel = channelOrPair[0];

  const hasPairedChannel = channelOrPair.length > 1;
  const resolvedChannel = resolvePairedChannel(
    channelOrPair,
    savePaymentMethod,
  );

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
    sdk?.dispatchEvent(
      new InternalUpdateChannelComponentData(firstMemberChannel.channel_code, {
        savePaymentMethod: checked,
      }),
    );
  };

  return (
    <ChannelContext.Provider value={resolvedChannel}>
      <ChannelComponentDataContext.Provider value={channelData}>
        <div className="xendit-payment-channel" ref={divRef}>
          <ChannelForm
            ref={formRef}
            form={resolvedChannel.form}
            onChannelPropertiesChanged={onChannelPropertiesChanged}
          />
          {resolvedChannel.banner ? (
            <Banner banner={resolvedChannel.banner} />
          ) : null}
          {shouldShowSaveCheckbox && (
            <Checkbox
              label={t("payment.save_checkbox_label")}
              onChange={handleCheckboxChange}
              checked={savePaymentMethod}
            />
          )}
          {instructions ? (
            <div className="xendit-payment-channel-instructions">
              {
                // Since there should only be one QR_CODE channel per market, show brand logo instead
                resolvedChannel.pm_type === "QR_CODE" ? (
                  <img
                    src={resolvedChannel.brand_logo_url}
                    alt={resolvedChannel.brand_name}
                    className="xendit-payment-channel-instructions-logo"
                  />
                ) : (
                  <InstructionsIcon />
                )
              }
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
      </ChannelComponentDataContext.Provider>
    </ChannelContext.Provider>
  );
};

const Banner: FunctionComponent<{ banner: BffChannelBanner }> = (props) => {
  if (props.banner?.link_url) {
    return (
      <a href={props.banner.link_url} target="_blank" rel="noopener noreferrer">
        <img
          src={props.banner.image_url}
          alt={props.banner.alt_text}
          className="xendit-payment-channel-banner"
          style={{
            aspectRatio: String(props.banner.aspect_ratio),
          }}
        />
      </a>
    );
  }

  return (
    <img
      src={props.banner.image_url}
      alt={props.banner.alt_text}
      className="xendit-payment-channel-banner"
      style={{
        aspectRatio: String(props.banner.aspect_ratio),
      }}
    />
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
