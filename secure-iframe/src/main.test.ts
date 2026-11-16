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
  exportPublicJwk,
  exportPublicKey,
  generateKeys,
  generatePinningKeyPair,
  signPublicKey,
} from "./crypto-test-utils";
import { IframeChangeEvent, IframeReadyEvent } from "../../shared/types";
import { screen } from "@testing-library/dom";

let pinningKey: CryptoKey;
let pinningPublicJwk: JsonWebKey;
let ecdhKeyPair: CryptoKeyPair;
beforeEach(async () => {
  const pinningKeyPair = await generatePinningKeyPair();
  pinningKey = pinningKeyPair.privateKey;
  pinningPublicJwk = await exportPublicJwk(pinningKeyPair);
  ecdhKeyPair = await generateKeys();
});

beforeEach(async () => {
  setJwksResponse([pinningPublicJwk]);
  await setQueryParams({});
});

afterEach(() => {
  vitest.unstubAllGlobals();
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
        await sleep(1000); // wait for async webcrypto calls
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
        await sleep(1000); // wait for async webcrypto calls
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
        await sleep(1000); // wait for async webcrypto calls
      },
    );

    await validateEncryptedText(readyEvent, changeEvent, ["123"]);
  });
});

describe("secure iframe ui - main - jwks", () => {
  it("should initialize with one of multiple fetched keys", async () => {
    const unrelatedKeyPair = await generatePinningKeyPair();
    setJwksResponse([
      await exportPublicJwk(unrelatedKeyPair),
      pinningPublicJwk,
    ]);

    await expectPostMessage(
      { type: "xendit-iframe-ready", ecdhPublicKey: expect.any(String) },
      async () => {
        await main();
      },
    );
  });

  it("should fail initialization on a non-2xx JWKS response", async () => {
    const fetchMock = setJwksResponse([pinningPublicJwk], { status: 503 });

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should fail initialization on malformed JWKS JSON", async () => {
    const fetchMock = setJwksRawResponse("{not-json");

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should fail initialization on an empty JWKS key array", async () => {
    const fetchMock = setJwksResponse([]);

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should fail initialization on a JWKS entry with private d material", async () => {
    const fetchMock = setJwksResponse([
      { ...pinningPublicJwk, d: "private-key-material" },
    ]);

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should fail initialization when the JWKS request itself fails", async () => {
    const fetchMock = vitest
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    vitest.stubGlobal("fetch", fetchMock);

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should refresh once and retry verification after a mismatch", async () => {
    const unrelatedKeyPair = await generatePinningKeyPair();
    const fetchMock = vitest
      .fn()
      .mockResolvedValueOnce(
        jwksResponse([await exportPublicJwk(unrelatedKeyPair)]),
      )
      .mockResolvedValueOnce(jwksResponse([pinningPublicJwk]));
    vitest.stubGlobal("fetch", fetchMock);

    await expectPostMessage(
      { type: "xendit-iframe-ready", ecdhPublicKey: expect.any(String) },
      async () => {
        await main();
      },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: "default" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ cache: "reload" });
  });

  it("should fail after the refreshed key set also does not verify", async () => {
    const unrelatedKeyPair = await generatePinningKeyPair();
    const unrelatedPublicJwk = await exportPublicJwk(unrelatedKeyPair);
    const fetchMock = vitest
      .fn()
      .mockResolvedValueOnce(jwksResponse([unrelatedPublicJwk]))
      .mockResolvedValueOnce(jwksResponse([unrelatedPublicJwk]));
    vitest.stubGlobal("fetch", fetchMock);

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should not fall back to embedded build-time keys", async () => {
    const unrelatedKeyPair = await generatePinningKeyPair();
    const fetchMock = vitest
      .fn()
      .mockResolvedValue(
        jwksResponse([await exportPublicJwk(unrelatedKeyPair)]),
      );
    vitest.stubGlobal("fetch", fetchMock);

    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("secure iframe ui - main - null origin", () => {
  it("should fail if embedder origin is null", async () => {
    await setQueryParams({ embedder: "null" });
    await expectPostMessage({ type: "xendit-iframe-failed-init" }, async () => {
      await main().catch(fatalError);
    });
    expect(screen.getByText("✕ null embedder origin")).toBeInTheDocument();
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

function jwksResponse(keys: unknown[], init?: { status?: number }) {
  return new Response(JSON.stringify({ keys }), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function setJwksResponse(keys: unknown[], init?: { status?: number }) {
  const fetchMock = vitest
    .fn()
    .mockImplementation(() => Promise.resolve(jwksResponse(keys, init)));
  vitest.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function setJwksRawResponse(body: string) {
  const fetchMock = vitest.fn().mockImplementation(() =>
    Promise.resolve(
      new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
  vitest.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

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
  const queryString = new URLSearchParams({
    input_type: allParams.input_type,
    embedder: allParams.embedder,
    appearance: allParams.appearance,
  }).toString();
  const hashString = new URLSearchParams({
    session_id: allParams.session_id,
    pk: allParams.pk,
    sig: allParams.sig,
  }).toString();
  history.replaceState(null, "", `?${queryString}#${hashString}`);
}

/**
 * Expect that calling fn results in a specific postMessage call.
 *
 * Call postMessage within fn, it must be called before returning.
 */
async function expectPostMessage(message: object, fn: () => void) {
  const eventHandler = vitest.fn();
  window.parent.addEventListener("message", eventHandler);
  await fn();

  // postMessage has a setTimeout(0) so we need to do it here too
  await sleep(0);

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
  const sessionId = new URLSearchParams(location.hash.slice(1)).get(
    "session_id",
  );
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
