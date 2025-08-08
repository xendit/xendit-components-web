import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { FieldProps, formFieldName } from "./field";
import { useSession } from "./session-provider";
import { IframeEvent } from "../../../shared/shared";

const IFRAME_ORIGIN = "https://localhost:4444";
const IFRAME_FIELD_SRC = `${IFRAME_ORIGIN}/iframe.html`;

export const IframeField: React.FC<FieldProps> = (props) => {
  const { field, onChange } = props;

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

      const expectedOrigin = IFRAME_ORIGIN;
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
          const result = [
            "xendit-encrypted",
            encryptionVersion,
            iframeEcdhPublicKey,
            encrypted.iv,
            encrypted.value
          ].join("-");

          hiddenFieldRef.current.value = result;
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
    [iframeEcdhPublicKey, onChange]
  );

  useEffect(() => {
    window.addEventListener("message", handleEventFromIframe);
    return () => {
      window.removeEventListener("message", handleEventFromIframe);
    };
  }, [handleEventFromIframe]);

  const iframeUrl = new URL(IFRAME_FIELD_SRC);
  iframeUrl.searchParams.set("input_type", field.type.name);
  iframeUrl.searchParams.set("embedder", window.location.origin);
  iframeUrl.searchParams.set("session_id", session.payment_session_id);
  const keyParts = session.client_key.split("-");
  iframeUrl.searchParams.set("pk", keyParts[2]);
  iframeUrl.searchParams.set("sig", keyParts[3]);

  const focusClass = focusWithin ? "xendit-field-focus" : "";

  console.log("render iframe", iframeUrl.search.toString());

  return (
    <div className={`xendit-iframe-container ${focusClass}`}>
      <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
      <iframe src={iframeUrl.toString()} ref={iframeRef} />
    </div>
  );
};
