import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { FieldProps, formFieldName } from "./field";
import { useSdk, useSession } from "./session-provider";
import { IframeEvent } from "../../../shared/shared";

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
          setFocusWithin(false);
          break;
        }
        case "failed_init": {
          break;
        }
      }
    },
    [iframeData.origin, iframeEcdhPublicKey, onChange],
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
  const keyParts = session.client_key.split("-");
  iframeUrl.searchParams.set("pk", keyParts[2]);
  iframeUrl.searchParams.set("sig", keyParts[3]);

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  return (
    <div className={`xendit-iframe-container ${focusClass}`}>
      <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
      <iframe src={iframeUrl.toString()} ref={iframeRef} />
    </div>
  );
};
