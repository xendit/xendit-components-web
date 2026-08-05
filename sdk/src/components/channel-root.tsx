import ChannelForm, { ChannelFormHandle } from "./channel-form";
import { useContext, useLayoutEffect, useRef } from "preact/hooks";
import {
  ComponentChildren,
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
import { GraphicRedirectInstructions } from "./graphic-redirect-instructions";
import { GraphicQrScan } from "./graphic-qr-scan";
import { useCustomer, useSdk, useSession } from "./session-provider";
import { Checkbox } from "./core/checkbox";
import { resolvePairedChannel } from "../utils";
import { ChannelComponentData } from "../public-sdk";
import { InternalUpdateChannelComponentData } from "../private-event-types";
import { CustomerDetailsFormHandle, CustomerForm } from "./customer-form";
import { CustomerDetails } from "../backend-types/customer";
import { internal } from "../internal";
import { changedChannelProperties } from "../utils-channel-properties";

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
  customerDetailsFormRef: RefObject<CustomerDetailsFormHandle>;
}

export const ChannelRoot: FunctionComponent<Props> = (props) => {
  const {
    channelOrPair,
    channelData,
    savePaymentMethod,
    formRef,
    customerDetailsFormRef,
  } = props;
  const divRef = useRef<HTMLDivElement>(null);
  const sdk = useSdk();
  const { t } = sdk;
  const session = useSession();
  const customer = useCustomer();

  // events always use channelOrPair[0] because the CachedChannelComponents are keyed by that
  const firstMemberChannel = channelOrPair[0];

  const hasPairedChannel = channelOrPair.length > 1;
  const resolvedChannel = resolvePairedChannel(
    channelOrPair,
    savePaymentMethod,
  );

  const shouldShowCustomerDetailsForm =
    resolvedChannel.requires_customer_details && !customer;
  const instructions = instructionsAsTuple(resolvedChannel.instructions);

  const telemetrySentEventKeys = useRef(new Set<string>());
  const lastSeenUserData = useRef<ChannelProperties>({
    channel_properties: {},
    should_save: false,
    customer_details: {},
  });
  const telemetryForFormChange = (
    newUserData: Partial<ChannelProperties>,
    isInitial = false,
  ) => {
    const mergedNextUserData = {
      ...lastSeenUserData.current,
      ...newUserData,
    };

    if (!isInitial) {
      const changedFields: string[] = [];
      changedChannelProperties(
        lastSeenUserData.current,
        mergedNextUserData,
        changedFields,
      );
      for (const changedKey of changedFields) {
        if (telemetrySentEventKeys.current.has(changedKey)) continue;
        telemetrySentEventKeys.current.add(changedKey);

        sdk[internal].telemetry.append({
          stage: "CHECKOUT_CHANNEL_FORM_INPUT",
          payment_channel: firstMemberChannel.channel_code,
          success: true,
          metadata: { field_name: changedKey },
        });
      }
    }

    lastSeenUserData.current = mergedNextUserData;
  };

  const onChannelPropertiesChanged = (
    channelProperties: ChannelProperties,
    isInitial: boolean,
  ) => {
    let cleanedProperties = channelProperties;

    // special behavior for cards with installments
    if (
      firstMemberChannel.channel_code === "CARDS" &&
      channelProperties.installment_configuration
    ) {
      // for cards installment configuration, we need to remove any properties that have empty string values,
      // because the presence of those properties causes validation errors, even if the value is an empty string
      const cleanedInstallmentConfiguration = Object.fromEntries(
        Object.entries(channelProperties.installment_configuration).filter(
          ([_, value]) => value !== "",
        ),
      );
      if (Object.keys(cleanedInstallmentConfiguration).length === 0) {
        // if there are no valid properties left, set installment_configuration to undefined to avoid validation errors
        cleanedProperties = {
          ...channelProperties,
          installment_configuration: undefined,
        };
      } else {
        cleanedProperties = {
          ...channelProperties,
          installment_configuration: cleanedInstallmentConfiguration,
        };
      }
    }

    const event = new XenditChannelPropertiesChangedEvent(
      firstMemberChannel.channel_code,
      cleanedProperties,
    );
    divRef.current?.dispatchEvent(event);

    telemetryForFormChange(
      { channel_properties: cleanedProperties },
      isInitial,
    );
  };

  const onCustomerDetailsChanged = (customerDetails: CustomerDetails) => {
    sdk?.dispatchEvent(
      new InternalUpdateChannelComponentData(firstMemberChannel.channel_code, {
        customerDetails,
      }),
    );
    telemetryForFormChange({ customer_details: customerDetails });
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
    telemetryForFormChange({ save_payment_method: checked });
  };

  useLayoutEffect(() => {
    if (
      !instructions &&
      !resolvedChannel.form.length &&
      !resolvedChannel.banner
    ) {
      console.error(
        `Missing display data for ${resolvedChannel.channel_code}, this is a bug, please contact support`,
      );
    }
  }, [
    instructions,
    resolvedChannel.banner,
    resolvedChannel.channel_code,
    resolvedChannel.form,
  ]);

  return (
    <ChannelContext.Provider value={resolvedChannel}>
      <ChannelComponentDataContext.Provider value={channelData}>
        <div className="xendit-payment-channel" ref={divRef}>
          <ChannelForm
            ref={formRef}
            form={resolvedChannel.form}
            onChannelPropertiesChanged={onChannelPropertiesChanged}
          />
          {shouldShowCustomerDetailsForm && (
            <CustomerForm
              ref={customerDetailsFormRef}
              onChange={onCustomerDetailsChanged}
              value={channelData.customerDetails || { given_names: "" }}
            />
          )}

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
              {GRAPHIC_COMPONENTS_BY_PM_TYPE[resolvedChannel.pm_type ?? ""] ?? (
                <GraphicRedirectInstructions />
              )}
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

const GRAPHIC_COMPONENTS_BY_PM_TYPE: Record<string, ComponentChildren> = {
  EWALLET: <GraphicRedirectInstructions />,
  QR_CODE: <GraphicQrScan />,
};

const Banner: FunctionComponent<{ banner: BffChannelBanner }> = (props) => {
  const aspectRatio =
    typeof props.banner.aspect_ratio === "number"
      ? String(props.banner.aspect_ratio) // passing aspectRatio as a number does not work
      : undefined;

  if (props.banner?.link_url) {
    return (
      <a href={props.banner.link_url} target="_blank" rel="noopener noreferrer">
        <img
          src={props.banner.image_url}
          alt={props.banner.alt_text}
          className="xendit-payment-channel-banner"
          style={{
            aspectRatio,
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
        aspectRatio,
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
