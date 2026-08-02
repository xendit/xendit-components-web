import {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { FieldProps } from "./field";
import { useSdk, useSession } from "./session-provider";
import { IframeEvent } from "../../../shared/types";
import { useChannel, useChannelComponentData } from "./channel-root";
import { XenditFormAssociatedFocusTrap } from "./core/form-ascociated-focus-trap";
import { internal } from "../internal";
import { assert, cancellableSleep, formFieldId, formFieldName } from "../utils";
import { FunctionComponent } from "preact";
import { InternalSetFieldTouchedEvent } from "../private-event-types";
import { IframeRegistryContext } from "./iframe-registry";

// read iframe data from environment variable
assert(process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL);
const parsedIframeUrl = new URL(
  process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL,
);
const IFRAME_SRC = parsedIframeUrl.toString();
const IFRAME_ORIGIN = parsedIframeUrl.origin;

//  How long to wait for the iframe's `xendit-iframe-ready` before showing error.
const IFRAME_LOAD_TIMEOUT_MS = 8000;

export const IframeField: FunctionComponent<FieldProps> = (props) => {
  const { field, onChange } = props;

  const sdk = useSdk();

  const id = formFieldId(field);
  const name = formFieldName(field);
  const session = useSession();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hiddenFieldRef = useRef<HTMLInputElement>(null);
  const [iframeEcdhPublicKey, setIframeEcdhPublicKey] = useState<
    string | undefined
  >();
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  const [focusWithin, setFocusWithin] = useState(false);

  const { card } = useChannel() ?? {};

  const channelData = useChannelComponentData();
  const schemes = channelData?.cardDetails?.details?.schemes;
  const selectedCardBrand =
    schemes?.find((scheme) => card?.brands?.some((b) => b.name === scheme)) ??
    null;

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
          setStatus("ready");
          break;
        }
        case "xendit-iframe-change": {
          if (!hiddenFieldRef.current) return;

          const encrypted = data.encrypted;
          const encryptionVersion = 1;
          const resultData = encrypted.map((enc) => {
            if (data.empty) {
              return "";
            }

            const parts = [
              "xendit-encrypted",
              encryptionVersion,
              iframeEcdhPublicKey,
              enc.iv,
              enc.value,
            ];

            if (!data.valid && data.validationErrorCodes.length) {
              // append validation error if invalid - because the validation code can't validate an encrypted string
              parts.push(
                "invalid",
                btoa(data.validationErrorCodes[0].localeKey),
              );
            }

            return parts.join("-");
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
          setFocusWithin(false);
          if (hiddenFieldRef.current?.value) {
            // mark field as touched if not empty
            hiddenFieldRef.current?.dispatchEvent(
              new InternalSetFieldTouchedEvent(),
            );
          }
          break;
        }
        case "xendit-iframe-failed-init": {
          console.error(
            `Iframe field for ${field.channel_property} failed to initialize securely`,
          );
          setStatus((prev) => (prev === "loading" ? "failed" : prev));
          break;
        }
      }
    },
    [field.channel_property, iframeEcdhPublicKey, onChange],
  );

  const giveFocusToIframe = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "xendit-iframe-focus" satisfies IframeEvent["type"] },
        IFRAME_ORIGIN,
      );
    }
  }, []);

  useLayoutEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  const registry = useContext(IframeRegistryContext);
  useLayoutEffect(() => {
    registry?.registerIframe(name, iframeRef);
    return () => registry?.unregisterIframe(name);
  }, [name, registry]);

  useLayoutEffect(() => {
    if (status !== "loading") return;

    const controller = new AbortController();
    cancellableSleep(IFRAME_LOAD_TIMEOUT_MS, controller.signal)
      .then(() => setStatus("failed"))
      .catch(() => {
        // aborted because the iframe answered, or the component unmounted
      });

    return () => controller.abort();
  }, [status]);

  const iframeUrl = new URL(IFRAME_SRC);
  iframeUrl.searchParams.set("input_type", field.type.name);
  iframeUrl.searchParams.set("embedder", window.location.origin);
  // Pass appearance options if provided
  if (sdk[internal].options.iframeFieldAppearance) {
    iframeUrl.searchParams.set(
      "appearance",
      JSON.stringify(sdk[internal].options.iframeFieldAppearance),
    );
  }
  // Per-session values live in the URL fragment, not the query string, so that the request URL stays stable across sessions and the iframe stays cacheable.
  const iframeHashParams = new URLSearchParams();
  iframeHashParams.set("session_id", session.payment_session_id);
  iframeHashParams.set("pk", sdk[internal].sdkKey.publicKey);
  iframeHashParams.set("sig", sdk[internal].sdkKey.signature);
  iframeUrl.hash = iframeHashParams.toString();

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <div
      className={`xendit-iframe-container xendit-form-field-inner ${focusClass}`}
    >
      <XenditFormAssociatedFocusTrap.tag
        id={id}
        onFocus={giveFocusToIframe}
        tabIndex={-1}
      />
      <input type="hidden" name={name} defaultValue="" ref={hiddenFieldRef} />
      {status === "failed" && <IframeFieldError />}
      {status === "loading" && (
        <div className="xendit-shimmer xendit-iframe-shimmer" />
      )}
      <iframe
        src={iframeUrl.toString()}
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin"
        className={status === "ready" ? "" : "xendit-iframe-hidden"}
      />
      {status === "ready" &&
        field.type.name === "credit_card_number" &&
        card && (
          <CardBrands
            cardsBrandList={card.brands}
            selectedCardBrand={selectedCardBrand}
          />
        )}
    </div>
  );
};

const IframeFieldError: FunctionComponent = () => {
  const { t } = useSdk();

  return (
    <div className="xendit-iframe-field-error">
      <span className="xendit-error-message xendit-text-12">
        {t("card_field.load_failed")}
      </span>
    </div>
  );
};

const CardBrands = ({
  cardsBrandList,
  selectedCardBrand,
}: {
  cardsBrandList: { name: string; logo_url: string }[];
  selectedCardBrand: string | null;
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
