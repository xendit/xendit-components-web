import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vitest,
} from "vitest";
import { fatalError, main } from "./main";
import { randomHexString, sleep } from "../../sdk/src/utils";
import userEvent from "@testing-library/user-event";
import { arrayBufferToBase64, base64ToArrayBuffer } from "./utils";
import {
  decryptText,
  exportPublicKey,
  generateKeys,
  importPinningKeyForSigning,
  signPublicKey,
} from "./crypto-test-utils";
import { IframeChangeEvent, IframeReadyEvent } from "../../shared/types";
import { screen } from "@testing-library/dom";

// @ts-expect-error This macro is replaced with a JSON array by the build script
const pinningPrivateKey: JsonWebKey = PRIVATE_PINNING_KEY_MACRO;

let pinningKey: CryptoKey;
let ecdhKeyPair: CryptoKeyPair;
beforeEach(async () => {
  pinningKey = await importPinningKeyForSigning(pinningPrivateKey);
  ecdhKeyPair = await generateKeys();
});

beforeEach(async () => {
  await setQueryParams({});
});

afterEach(() => {
  document.body.replaceChildren();
});

describe("secure iframe ui - main - basics", () => {
  it("should send ready event", async () => {
    await expectPostMessage(
      { type: "xendit-iframe-ready", ecdhPublicKey: expect.any(String) },
      async () => {
        await main();
      },
    );
  });

  it("should create an input element", async () => {
    await main();
    const input = document.querySelector("input");
    expect(input).toBeInTheDocument();
  });

  it("should send focus and blur events", async () => {
    await main();
    await expectPostMessage({ type: "xendit-iframe-focus" }, async () => {
      const input = document.querySelector("input");
      expect(input).toBeInTheDocument();
      input?.focus();
    });
    await expectPostMessage({ type: "xendit-iframe-blur" }, async () => {
      const input = document.querySelector("input");
      expect(input).toBeInTheDocument();
      input?.blur();
    });
  });

  it("should focus from external event", async () => {
    await main();
    await expectPostMessage({ type: "xendit-iframe-focus" }, async () => {
      const e = new MessageEvent("message", {
        data: { type: "xendit-iframe-focus" },
      });
      Object.defineProperty(e, "origin", { value: location.origin });
      Object.defineProperty(e, "source", { value: window.parent });
      window.dispatchEvent(e);
      await sleep(100);
      expect(document.activeElement).toBe(document.querySelector("input"));
    });
  });

  it("should send change event for card number field", async () => {
    const readyEvent = await expectPostMessage(
      { type: "xendit-iframe-ready" },
      async () => {
        await main();
      },
    );
    const changeEvent = await expectPostMessage(
      {
        type: "xendit-iframe-change",
        cardBrand: "VISA",
        empty: false,
        valid: true,
        validationErrorCodes: [],
        encrypted: [
          {
            iv: expect.any(String),
            value: expect.any(String),
          },
        ],
      },
      async () => {
        const input = document.querySelector("input");
        assert(input);
        await userEvent.click(input);
        await userEvent.paste("4111 1111 1111 1111");
      },
    );

    await validateEncryptedText(readyEvent, changeEvent, ["4111111111111111"]);
  });

  it("should send change event for card expiry field", async () => {
    await setQueryParams({ input_type: "credit_card_expiry" });
    const readyEvent = await expectPostMessage(
      { type: "xendit-iframe-ready" },
      async () => {
        await main();
      },
    );
    const changeEvent = await expectPostMessage(
      {
        type: "xendit-iframe-change",
        cardBrand: null,
        empty: false,
        valid: true,
        validationErrorCodes: [],
        encrypted: [
          {
            iv: expect.any(String),
            value: expect.any(String),
          },
          {
            iv: expect.any(String),
            value: expect.any(String),
          },
        ],
      },
      async () => {
        const input = document.querySelector("input");
        assert(input);
        await userEvent.click(input);
        await userEvent.paste("1234");
      },
    );

    await validateEncryptedText(readyEvent, changeEvent, ["12", "2034"]);
  });

  it("should send change event for card cvn field", async () => {
    await setQueryParams({ input_type: "credit_card_cvn" });
    const readyEvent = await expectPostMessage(
      { type: "xendit-iframe-ready" },
      async () => {
        await main();
      },
    );
    const changeEvent = await expectPostMessage(
      {
        type: "xendit-iframe-change",
        cardBrand: null,
        empty: false,
        valid: true,
        validationErrorCodes: [],
        encrypted: [
          {
            iv: expect.any(String),
            value: expect.any(String),
          },
        ],
      },
      async () => {
        const input = document.querySelector("input");
        assert(input);
        await userEvent.click(input);
        await userEvent.paste("123");
      },
    );

    await validateEncryptedText(readyEvent, changeEvent, ["123"]);
  });
});

describe("secure iframe ui - fatalError", () => {
  it("should send fatal error event", async () => {
    await expectPostMessage(
      {
        type: "xendit-iframe-failed-init",
      },
      async () => {
        const err = new Error("Test fatal error");
        (err as unknown as { code: string }).code = "test error";
        fatalError(err);
      },
    );
    expect(screen.getByText("✕ test error")).toBeInTheDocument();
  });
});

/**
 * Change the query string.
 */
async function setQueryParams(params: Record<string, string>) {
  const defaults = {
    input_type: "credit_card_number",
    embedder: location.origin, // <- must do this or the test will not work
    session_id: `ps-${randomHexString(24)}`,
    pk: arrayBufferToBase64(await exportPublicKey(ecdhKeyPair)),
    sig: arrayBufferToBase64(await signPublicKey(ecdhKeyPair, pinningKey)),
    appearance: JSON.stringify({
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
    }),
  };
  const allParams = { ...defaults, ...params };
  const queryString = new URLSearchParams(allParams).toString();
  history.replaceState(null, "", `?${queryString}`);
}

/**
 * Expect that calling fn results in a specific postMessage call.
 */
async function expectPostMessage(message: object, fn: () => void) {
  const eventHandler = vitest.fn();
  window.parent.addEventListener("message", eventHandler);
  await fn();
  await sleep(1); // postMessage has an internal timeout, we need to wait
  expect(eventHandler).toHaveBeenCalled();

  let lastError: Error | null = null;
  for (const call of eventHandler.mock.calls) {
    try {
      expect(call[0].data).toMatchObject(message);
      window.parent.removeEventListener("message", eventHandler);
      return call[0].data;
    } catch (e) {
      lastError = e as Error;
    }
  }
  window.parent.removeEventListener("message", eventHandler);
  throw lastError;
}

/**
 * Given the ready event (which has the public key) and a change event (which has the encrypted data),
 * assert that the encrypted data can be decrypted to the expected string(s).
 */
async function validateEncryptedText(
  readyEvent: IframeReadyEvent,
  changeEvent: IframeChangeEvent,
  expectedStrings: string[],
) {
  const sessionId = new URLSearchParams(location.search).get("session_id");
  assert(sessionId);

  for (let i = 0; i < changeEvent.encrypted.length; i++) {
    const expectedString = expectedStrings[i];
    const decrypted = await decryptText(
      ecdhKeyPair,
      base64ToArrayBuffer(readyEvent.ecdhPublicKey),
      changeEvent.encrypted[i],
      sessionId,
    );
    expect(decrypted).toBe(expectedString);
  }
}
