import type { IframeAppearanceOptions } from "../../sdk/src";
import type { IframeEvent, IframeFieldType } from "../../shared/types";
import {
  deriveSharedKey,
  encryptText,
  generateOwnKeys,
  hashText,
  pin,
} from "./crypto";
import {
  applyFontFace,
  applyInputStyles,
  applyPlaceholderStyles,
} from "./css-sanitizer";
import { assertIsSecureInputEvent } from "./events";
import {
  createFatalErrorComponent,
  createInputElement,
  createWrapperDiv,
} from "./ui";
import { arrayBufferToBase64, assert, base64ToArrayBuffer } from "./utils";
import { validate } from "./validation";

function getQueryInputs() {
  const query = new URLSearchParams(location.search);

  const inputType = query.get("input_type");
  assert(inputType, "missing qs input_type");
  const embedderOrigin = query.get("embedder");
  assert(embedderOrigin, "missing qs embedder");
  const sessionId = query.get("session_id");
  assert(sessionId, "missing qs session_id");
  const serverPublicKeyBase64 = query.get("pk");
  assert(serverPublicKeyBase64, "missing qs pk");
  const serverPublicKeySignatureBase64 = query.get("sig");
  assert(serverPublicKeySignatureBase64, "missing qs sig");
  const appearanceOptions = query.get("appearance");

  return {
    inputType: inputType as IframeFieldType,
    embedderOrigin,
    sessionId,
    serverPublicKeyBase64,
    serverPublicKeySignatureBase64,
    appearanceOptions,
  };
}

// @ts-expect-error This macro is replaced with a JSON array by the build script
const masterPinningKeys: JsonWebKey[] = PINNING_KEYS_MACRO;

function insecurePostMessage<T extends IframeEvent>(message: T) {
  window.parent.postMessage(message, "*");
}

export async function init() {
  document.body.style.margin = "0";

  assert(masterPinningKeys.length > 0, "missing pinning keys");
  assert(origin !== "null", "null origin");
  assert(window.crypto?.subtle, "crypto unsupported");

  const queryInputs = getQueryInputs();

  function securePostMessage<T extends IframeEvent>(message: T) {
    window.parent.postMessage(message, queryInputs.embedderOrigin);
  }

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
    type: "xendit-iframe-ready",
    ecdhPublicKey: arrayBufferToBase64(ownPublicKeyBytes),
  });

  // create input element
  const wrapper = createWrapperDiv();
  document.body.appendChild(wrapper);
  const input = createInputElement(queryInputs.inputType);
  wrapper.appendChild(input);

  // apply appearance options if provided
  if (queryInputs.appearanceOptions) {
    let appearance: IframeAppearanceOptions;
    try {
      appearance = JSON.parse(
        decodeURIComponent(queryInputs.appearanceOptions),
      );
    } catch {
      assert(false, "appearance param is not json");
    }

    applyFontFace(appearance);
    applyInputStyles(input, appearance);
    applyPlaceholderStyles(input, appearance);
  }

  let lastValue: string[] = [];

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
        // convert from "MM/YY" to [MM, YYYY]
        const parts = value.split("/");
        const month = (parts[0] ?? "").trim();
        let year = (parts[1] ?? "").trim();
        if (year.length === 2) {
          year = `20${year}`;
        }
        extractedInputValues = [month, year];
        break;
      }
      default: {
        throw new Error(`Unsupported input type: ${queryInputs.inputType}`);
      }
    }

    // skip sending the change event if value didn't change
    if (JSON.stringify(lastValue) === JSON.stringify(extractedInputValues)) {
      return;
    }
    lastValue = extractedInputValues;

    // encrypt each value
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
      type: "xendit-iframe-change",
      encrypted,
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
          type: "xendit-iframe-focus",
        });
        return;
      case "blur":
        securePostMessage({
          type: "xendit-iframe-blur",
        });
        return;
    }
  });

  // handle focus request from parent
  window.addEventListener("message", (event) => {
    if (
      event.origin !== queryInputs.embedderOrigin ||
      event.source !== window.parent
    ) {
      return;
    }
    const data = event.data as IframeEvent;
    if (data.type === "xendit-iframe-focus") {
      input.focus();
    }
  });
}

export function fatalError(err: Error) {
  console.error(`Xendit secure iframe`, err);
  const errorComponent = createFatalErrorComponent(
    (err as unknown as { code?: string }).code ?? "error",
  );
  document.body.replaceChildren(errorComponent);
  insecurePostMessage({
    type: "xendit-iframe-failed-init",
  });
}
