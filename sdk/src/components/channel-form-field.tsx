import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChannelFormField } from "../forms-types";
import { BffSession } from "../bff-types";
import { IframeEvent } from "../../../shared/shared";
import { useSession } from "./session-provider";

const IFRAME_ORIGIN = "https://localhost:4444";
const IFRAME_FIELD_SRC = `${IFRAME_ORIGIN}/iframe.html`;

interface Props {
  field: ChannelFormField | null;
  onChange?: () => void;
}

export const ChannelFormFieldComponent: React.FC<Props> = ({
  field,
  onChange
}) => {
  const session = useSession();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hiddenFieldRef = useRef<HTMLInputElement>(null);
  const [iframeEcdhPublicKey, setIframeEcdhPublicKey] = useState<
    string | undefined
  >();

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
          break;
        }
        case "blur": {
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

  const handleChange = useCallback(() => {
    if (!field) return;
    onChange?.();
  }, [field, onChange]);

  if (!field) {
    return null;
  }

  let id: string;
  if (typeof field.channel_property === "string") {
    id = field.channel_property;
  } else {
    const keys = Object.values(field.channel_property);
    id = keys.join("__");
  }

  const renderIframeField = (
    id: string,
    session: BffSession,
    field: ChannelFormField
  ) => {
    const iframeUrl = new URL(IFRAME_FIELD_SRC);
    iframeUrl.searchParams.set("input_type", field.type.name);
    iframeUrl.searchParams.set("embedder", window.location.origin);
    iframeUrl.searchParams.set("session_id", session.payment_session_id);
    const keyParts = session.client_key.split("-");
    iframeUrl.searchParams.set("pk", keyParts[2]);
    iframeUrl.searchParams.set("sig", keyParts[3]);

    return (
      <div className="xendit-iframe-container">
        <input type="hidden" name={id} defaultValue="" ref={hiddenFieldRef} />
        <iframe src={iframeUrl.toString()} ref={iframeRef} />
      </div>
    );
  };

  const renderTextField = (id: string, field: ChannelFormField) => {
    function isTextField(field: ChannelFormField): field is ChannelFormField & {
      type: { name: "text" };
    } {
      return field.type.name === "text";
    }

    return (
      <input
        name={id}
        type="text"
        placeholder={field.placeholder}
        className="xendit-text-14"
        onChange={handleChange}
        minLength={isTextField(field) ? field.type.min_length : undefined}
        maxLength={isTextField(field) ? field.type.max_length : undefined}
      />
    );
  };

  const renderDropdownField = (
    id: string,
    field: ChannelFormField & { type: { name: "dropdown" } }
  ) => {
    return (
      <select name={id} onChange={handleChange}>
        {field.type.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };

  const renderCountryField = (id: string, field: ChannelFormField) => {
    return (
      <select name={id} onChange={handleChange}>
        {Object.entries(countries).map(([code, data]) => (
          <option key={code} value={code}>
            {toFlagEmoji(code)} {data.name}
          </option>
        ))}
      </select>
    );
  };

  const renderField = (
    id: string,
    session: BffSession,
    field: ChannelFormField
  ) => {
    switch (field.type.name) {
      case "credit_card_number":
      case "credit_card_expiry":
      case "credit_card_cvn":
        return renderIframeField(id, session, field);
      case "phone_number":
      case "email":
      case "postal_code":
      case "text":
        return renderTextField(id, field);
      case "country":
        return renderCountryField(id, field);
      case "dropdown":
        return renderDropdownField(
          id,
          field as ChannelFormField & { type: { name: "dropdown" } }
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`xendit-channel-form-field xendit-form-field-span-${field.span}`}
    >
      <label htmlFor={id} className="xendit-text-14">
        {field.label ?? ""}
      </label>
      {renderField(id, session, field)}
    </div>
  );
};

// TODO: use images instead (flag emojis don't work in windows)
function toFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// TODO: pull this from a library
const countries = {
  ID: { name: "Indonesia", phoneCode: "62" },
  MY: { name: "Malaysia", phoneCode: "60" },
  PH: { name: "Philippines", phoneCode: "63" },
  SG: { name: "Singapore", phoneCode: "65" },
  TH: { name: "Thailand", phoneCode: "66" },
  VN: { name: "Vietnam", phoneCode: "84" }
};
