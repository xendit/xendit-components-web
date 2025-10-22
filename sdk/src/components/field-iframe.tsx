import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FieldProps, formFieldName } from "./field";
import { useSdk, useSession } from "./session-provider";
import {
  CardBrand,
  IframeChangeEvent,
  IframeEvent,
} from "../../../shared/types";
import { InputInvalidEvent, InputValidateEvent } from "../public-event-types";
import { useChannel } from "./payment-channel";
import { BffChannel } from "../backend-types/channel";

function getIframeByEnv(env: string) {
  switch (env) {
    case "production": {
      // TODO
      throw new Error("Production iframe not implemented yet");
    }
    case "local": {
      return {
        origin: "https://localhost:4444",
        src: `https://localhost:4444/iframe.html`,
      };
    }
    case "demo": {
      return {
        origin: "https://localhost:4442",
        src: `https://localhost:4442/secure-iframe/iframe.html`,
      };
    }
  }
  throw new Error(`Unknown env: ${env}`);
}

const computeFieldError = (state: ValidationState, required: boolean) => {
  if (state.empty && required) return "FIELD_IS_REQUIRED";
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
  validationErrorCodes: string[];
};

export const IframeField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;

  const sdk = useSdk();
  const iframeData = useMemo(() => getIframeByEnv(sdk.env), [sdk.env]);

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
  const [error, setError] = useState<string | null>(null);

  const [cardBrand, setCardBrand] = useState<CardBrand | null>(null);

  const { card } = useChannel() ?? {};

  const handleIframeEventResult = useCallback(
    (incoming?: IframeChangeEvent) => {
      setValidationResult((prev) => {
        const next = toValidationState(incoming, prev);
        if (!isTouched && incoming) return next;
        setError(computeFieldError(next, field.required));
        return next;
      });
    },
    [field.required, isTouched],
  );

  useEffect(() => {
    if (!hiddenFieldRef.current) return;
    const input = hiddenFieldRef.current;
    const listener = () => {
      const errorMessage = computeFieldError(
        {
          empty: validationResult.empty,
          validationErrorCodes: validationResult.validationErrorCodes,
        } as ValidationState,
        field.required,
      );
      setError(errorMessage);
      setIsTouched(true);
      if (errorMessage) input.dispatchEvent(new InputInvalidEvent());
    };
    input.addEventListener(InputValidateEvent.type, listener);
    return () => {
      input.removeEventListener(InputValidateEvent.type, listener);
    };
  }, [field.required, id, validationResult]);

  const handleEventFromIframe = useCallback(
    (event: MessageEvent) => {
      if (!iframeRef.current) return;

      const expectedSource = iframeRef.current.contentWindow;

      if (event.source !== expectedSource) {
        // this is normal, we are not the target of this message
        return;
      }

      const expectedOrigin = iframeData.origin;
      if (event.origin !== expectedOrigin) {
        // this is not normal, something fishy is happening
        return;
      }

      const data = event.data as IframeEvent;
      switch (data.type) {
        case "ready": {
          setIframeEcdhPublicKey(data.ecdhPublicKey);
          break;
        }
        case "change": {
          if (!hiddenFieldRef.current) return;

          handleIframeEventResult(data);
          setCardBrand(data.cardBrand ?? null);

          const encrypted = data.encrypted;
          const encryptionVersion = 1;
          const resultData = encrypted.map((enc) => {
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
        case "focus": {
          setFocusWithin(true);
          break;
        }
        case "blur": {
          if (!validationResult.empty) setIsTouched(true);
          handleIframeEventResult();
          setFocusWithin(false);
          break;
        }
        case "failed_init": {
          break;
        }
      }
    },
    [
      handleIframeEventResult,
      iframeData.origin,
      iframeEcdhPublicKey,
      onChange,
      validationResult.empty,
    ],
  );

  useEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  const iframeUrl = new URL(iframeData.src);
  iframeUrl.searchParams.set("input_type", field.type.name);
  iframeUrl.searchParams.set("embedder", window.location.origin);
  iframeUrl.searchParams.set("session_id", session.payment_session_id);
  const keyParts = session.components_sdk_key.split("-");
  iframeUrl.searchParams.set("pk", keyParts[2]);
  iframeUrl.searchParams.set("sig", keyParts[3]);

  const CardBrands = ({ card }: { card: BffChannel["card"] }) => {
    if (!card) return null;
    card.brands.sort((a, b) => a.name.localeCompare(b.name));
    const cardBrandLogo = card.brands.find(
      (b) => b.name === cardBrand,
    )?.logo_url;

    return (
      <div className="xendit-card-brands-list">
        {cardBrand
          ? cardBrandLogo && (
              <img
                className={"xendit-card-brand-logo"}
                src={cardBrandLogo}
                alt={cardBrand}
              />
            )
          : card.brands.map(({ name, logo_url }) => {
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

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <>
      <div
        className={`xendit-iframe-container ${focusClass} ${error ? "invalid" : ""}`}
      >
        <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
        <iframe src={iframeUrl.toString()} ref={iframeRef} />
        {field.type.name === "credit_card_number" && <CardBrands card={card} />}
      </div>
      {error && (
        <span className="xendit-error-message xendit-text-14">{error}</span>
      )}
    </>
  );
};
