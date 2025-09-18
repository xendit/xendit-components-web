import { IframeEvent, IframeFieldType } from "../../shared/types";
import {
  deriveSharedKey,
  encryptText,
  generateOwnKeys,
  hashText,
  pin,
} from "./crypto";
import { assertIsSecureInputEvent } from "./events";
import { createInputElement, createWrapperDiv } from "./ui";
import { arrayBufferToBase64, assert, base64ToArrayBuffer } from "./utils";
import { validate } from "./validation";

function setupCss() {
  const css = `
    body {
      margin: 0;
    }
    .input-wrapper {
      width: 100%;
      height: 100%;
      display: flex
    }
    input {
      width: 100%;
      font-size: 14px;
      line-height: 16px;
      padding: 12px;
      border: none;
      outline: none;
    }
`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}
setupCss();

function getQueryInputs() {
  const query = new URLSearchParams(location.search);

  const inputType = query.get("input_type");
  assert(inputType, "Missing query parameter: input_type");
  const embedderOrigin = query.get("embedder");
  assert(embedderOrigin, "Missing query parameter: embedder");
  const sessionId = query.get("session_id");
  assert(sessionId, "Missing query parameter: session_id");
  const serverPublicKeyBase64 = query.get("pk");
  assert(serverPublicKeyBase64, "Missing query parameter: pk");
  const serverPublicKeySignatureBase64 = query.get("sig");
  assert(serverPublicKeySignatureBase64, "Missing query parameter: sig");

  return {
    inputType: inputType as IframeFieldType,
    embedderOrigin,
    sessionId,
    serverPublicKeyBase64,
    serverPublicKeySignatureBase64,
  };
}

// @ts-expect-error This macro is replaced with a JSON array by the build script
const masterPinningKeys: JsonWebKey[] = PINNING_KEYS_MACRO;

const queryInputs = getQueryInputs();

function securePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, queryInputs.embedderOrigin);
}

function insecurePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, "*");
}

export async function init() {
  const serverPublicKeyBytes = base64ToArrayBuffer(
    queryInputs.serverPublicKeyBase64,
  );
  const serverPublicKeySignatureBytes = base64ToArrayBuffer(
    queryInputs.serverPublicKeySignatureBase64,
  );

  // pin public key
  await pin(
    masterPinningKeys,
    serverPublicKeySignatureBytes,
    serverPublicKeyBytes,
  );

  // create keys
  const ownKeyPair = await generateOwnKeys();
  const sharedKey = await deriveSharedKey(
    ownKeyPair,
    serverPublicKeyBytes,
    queryInputs.sessionId,
  );
  const ownPublicKeyBytes = await crypto.subtle.exportKey(
    "spki",
    ownKeyPair.publicKey,
  );

  // generate additionalData for gcm
  const sessionIdHashBytes = await hashText(queryInputs.sessionId);

  // tell parent frame about our public key
  securePostMessage({
    type: "ready",
    ecdhPublicKey: arrayBufferToBase64(ownPublicKeyBytes),
  });

  // create input element
  const wrapper = createWrapperDiv();
  document.body.appendChild(wrapper);
  const input = createInputElement(queryInputs.inputType);
  wrapper.appendChild(input);

  // event handlers
  async function handleChangeEvent(value: string) {
    const inputValue = value;
    const validationResult = validate(queryInputs.inputType, inputValue);

    let extractedInputValues: string[];
    switch (queryInputs.inputType) {
      case "credit_card_number": {
        extractedInputValues = [inputValue];
        break;
      }
      case "credit_card_cvn": {
        extractedInputValues = [inputValue];
        break;
      }
      case "credit_card_expiry": {
        const parts = inputValue.split("/");
        extractedInputValues = [
          (parts[0] ?? "").trim(),
          (parts[1] ?? "").trim(),
        ];
        break;
      }
      default: {
        throw new Error(`Unsupported input type: ${queryInputs.inputType}`);
      }
    }

    const encrypted = await Promise.all(
      extractedInputValues.map(async (value) => {
        const { ivBytes, cipherTextBytes } = await encryptText(
          value,
          sharedKey,
          sessionIdHashBytes,
        );
        return {
          iv: arrayBufferToBase64(ivBytes),
          value: arrayBufferToBase64(cipherTextBytes),
        };
      }),
    );

    securePostMessage({
      type: "change",
      encrypted,
      empty: value.length === 0,
      valid: validationResult.valid,
      validationErrorCodes: validationResult.errorCodes,
      cardBrand: validationResult.cardBrand ?? null,
    });
  }

  async function handleBlurEvent(value: string) {
    if (value.length === 0) return;
    const validationResult = validate(queryInputs.inputType, value);
    securePostMessage({
      type: "blur",
      empty: value.length === 0,
      valid: validationResult.valid,
      validationErrorCodes: validationResult.errorCodes,
      cardBrand: validationResult.cardBrand ?? null,
    });
  }

  // input change event
  input.addEventListener("secureinputevent", async (event) => {
    assertIsSecureInputEvent(event);
    switch (event.subtype) {
      case "change":
        if (event.detail.value === undefined) {
          throw new Error("Input value is undefined");
        }
        handleChangeEvent(event.detail.value).catch(fatalError);
        return;
      case "focus":
        securePostMessage({
          type: "focus",
        });
        return;
      case "blur":
        handleBlurEvent(event.detail.value ?? "").catch(fatalError);
        return;
    }
  });
}

export function fatalError(err: Error) {
  console.error(`Xendit secure iframe`, err);
  insecurePostMessage({
    type: "failed_init",
  });
}
