import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { FieldProps } from "./field";
import { useSdk, useSession } from "./session-provider";
import {
  CardBrand,
  IframeChangeEvent,
  IframeEvent,
} from "../../../shared/types";
import { InternalInputValidateEvent } from "../private-event-types";
import { useChannel } from "./payment-channel";
import { XenditFormAssociatedFocusTrap } from "./form-ascociated-focus-trap";
import { internal } from "../internal";
import { LocaleKey } from "../localization";
import { assert, formFieldName } from "../utils";

const computeFieldError = (
  state: ValidationState,
  required: boolean,
): LocaleKey | null => {
  if (state.empty && required)
    return {
      localeKey: "validation.required",
    };
  if (!state.validationErrorCodes?.length) return null;
  return state.validationErrorCodes[0] ?? null;
};

const toValidationState = (
  incoming: IframeChangeEvent | undefined,
  prev: ValidationState,
) => {
  if (!incoming) return prev;
  return {
    valid: incoming.valid,
    empty: incoming.empty,
    validationErrorCodes: incoming.validationErrorCodes ?? [],
  };
};

type ValidationState = {
  valid: boolean;
  empty: boolean;
  validationErrorCodes: LocaleKey[];
};

// read iframe data from environment variable
assert(process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL);
const parsedIframeUrl = new URL(
  process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL,
);
const IFRAME_SRC = parsedIframeUrl.toString();
const IFRAME_ORIGIN = parsedIframeUrl.origin;

export const IframeField: React.FC<FieldProps> = (props) => {
  const { field, onChange, onError } = props;

  const sdk = useSdk();

  const id = formFieldName(field);
  const session = useSession();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hiddenFieldRef = useRef<HTMLInputElement>(null);
  const [iframeEcdhPublicKey, setIframeEcdhPublicKey] = useState<
    string | undefined
  >();

  const [focusWithin, setFocusWithin] = useState(false);

  const [isTouched, setIsTouched] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationState>({
    empty: true,
    valid: false,
    validationErrorCodes: [],
  });

  const [cardBrand, setCardBrand] = useState<CardBrand | null>(null);

  const { card } = useChannel() ?? {};

  const handleErrorUpdate = useCallback(
    (validationState: ValidationState) => {
      const errorMessage = computeFieldError(validationState, field.required);
      if (onError) onError(id, errorMessage);
    },
    [field.required, id, onError],
  );

  const handleIframeEventResult = useCallback(
    (incoming?: IframeChangeEvent) => {
      setValidationResult((prev) => {
        const next = toValidationState(incoming, prev);
        if (!isTouched && incoming) return next;
        handleErrorUpdate(next);
        return next;
      });
    },
    [handleErrorUpdate, isTouched],
  );

  useEffect(() => {
    // listen to the Input validation event from parent form
    if (!hiddenFieldRef.current) return;
    const input = hiddenFieldRef.current;
    const listener = () => {
      handleErrorUpdate({
        empty: validationResult.empty,
        validationErrorCodes: validationResult.validationErrorCodes,
      } as ValidationState);
      setIsTouched(true);
    };
    input.addEventListener(InternalInputValidateEvent.type, listener);
    return () => {
      input.removeEventListener(InternalInputValidateEvent.type, listener);
    };
  }, [handleErrorUpdate, validationResult]);

  const handleEventFromIframe = useCallback(
    (event: MessageEvent) => {
      if (!iframeRef.current) return;

      const expectedSource = iframeRef.current.contentWindow;

      if (event.source !== expectedSource) {
        // this is normal, we are not the target of this message
        return;
      }

      if (event.origin !== IFRAME_ORIGIN) {
        // this is not normal, something fishy is happening
        return;
      }

      const data = event.data as IframeEvent;
      switch (data.type) {
        case "xendit-iframe-ready": {
          setIframeEcdhPublicKey(data.ecdhPublicKey);
          break;
        }
        case "xendit-iframe-change": {
          if (!hiddenFieldRef.current) return;

          handleIframeEventResult(data);
          setCardBrand(data.cardBrand);

          const encrypted = data.encrypted;
          const encryptionVersion = 1;
          const resultData = encrypted.map((enc) => {
            if (data.empty) {
              return "";
            }

            return [
              "xendit-encrypted",
              encryptionVersion,
              iframeEcdhPublicKey,
              enc.iv,
              enc.value,
            ].join("-");
          });

          if (resultData.length === 0) {
            break; // should never happen
          }

          // fields expecting a single value are normal strings, fields expecting multiple values are json arrays
          hiddenFieldRef.current.value =
            resultData.length > 1 ? JSON.stringify(resultData) : resultData[0];
          onChange?.();
          break;
        }
        case "xendit-iframe-focus": {
          setFocusWithin(true);
          break;
        }
        case "xendit-iframe-blur": {
          if (!validationResult.empty) setIsTouched(true);
          handleIframeEventResult();
          setFocusWithin(false);
          break;
        }
        case "xendit-iframe-failed-init": {
          console.error(
            `Iframe field for ${field.channel_property} failed to initialize securely`,
          );
          break;
        }
      }
    },
    [
      field.channel_property,
      handleIframeEventResult,
      iframeEcdhPublicKey,
      onChange,
      validationResult.empty,
    ],
  );

  const giveFocusToIframe = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "xendit-iframe-focus" satisfies IframeEvent["type"] },
        IFRAME_ORIGIN,
      );
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  const iframeUrl = new URL(IFRAME_SRC);
  iframeUrl.searchParams.set("input_type", field.type.name);
  iframeUrl.searchParams.set("embedder", window.location.origin);
  iframeUrl.searchParams.set("session_id", session.payment_session_id);

  iframeUrl.searchParams.set("pk", sdk[internal].sdkKey.publicKey);
  iframeUrl.searchParams.set("sig", sdk[internal].sdkKey.signature);

  // Pass appearance options if provided
  if (sdk[internal].options.appearance?.inputFieldProperties) {
    const appearance = {
      inputFieldProperties:
        sdk[internal].options.appearance.inputFieldProperties,
    };
    iframeUrl.searchParams.set("appearance", JSON.stringify(appearance));
  }

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <>
      <div className={`xendit-iframe-container ${focusClass}`}>
        <XenditFormAssociatedFocusTrap.tag
          id={id}
          onFocus={giveFocusToIframe}
          tabIndex={-1}
        />
        <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
        <iframe
          src={iframeUrl.toString()}
          ref={iframeRef}
          sandbox="allow-scripts allow-same-origin"
        />
        {field.type.name === "credit_card_number" && card && (
          <CardBrands
            cardsBrandList={card.brands}
            selectedCardBrand={cardBrand}
          />
        )}
      </div>
    </>
  );
};

const CardBrands = ({
  cardsBrandList,
  selectedCardBrand,
}: {
  cardsBrandList: { name: string; logo_url: string }[];
  selectedCardBrand: CardBrand | null;
}) => {
  if (!cardsBrandList) return null;

  const cardBrandLogo = cardsBrandList.find(
    (b) => b.name === selectedCardBrand,
  )?.logo_url;

  return (
    <div className="xendit-card-brands-list">
      {selectedCardBrand
        ? cardBrandLogo && (
            <img
              className={"xendit-card-brand-logo"}
              src={cardBrandLogo}
              alt={selectedCardBrand}
            />
          )
        : cardsBrandList.map(({ name, logo_url }) => {
            return (
              <img
                className={"xendit-card-brand-logo"}
                src={logo_url}
                alt={name}
                key={name}
              />
            );
          })}
    </div>
  );
};
