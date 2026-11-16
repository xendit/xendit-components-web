import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPinningKeys } from "./jwks";
import { exportPublicJwk, generatePinningKeyPair } from "./crypto-test-utils";

const JWKS_URL = "https://gateway.example.test/.well-known/jwks.json";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jwksResponse(keys: unknown[], init?: { status?: number }) {
  return new Response(JSON.stringify({ keys }), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "max-age=300",
    },
  });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("secure iframe jwks - loadPinningKeys", () => {
  it("fetches public keys using normal browser caching", async () => {
    const keyPair = await generatePinningKeyPair();
    const publicJwk = await exportPublicJwk(keyPair);
    const fetchMock = stubFetch(jwksResponse([publicJwk]));

    const keys = await loadPinningKeys(JWKS_URL);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      JWKS_URL,
      expect.objectContaining({
        cache: "default",
        credentials: "omit",
        method: "GET",
        redirect: "error",
      }),
    );
    expect(keys).toEqual([
      {
        kty: publicJwk.kty,
        crv: publicJwk.crv,
        x: publicJwk.x,
        y: publicJwk.y,
      },
    ]);
  });

  it("bypasses the cache when refreshing", async () => {
    const keyPair = await generatePinningKeyPair();
    const fetchMock = stubFetch(jwksResponse([await exportPublicJwk(keyPair)]));

    await loadPinningKeys(JWKS_URL, "refresh");

    expect(fetchMock).toHaveBeenCalledWith(
      JWKS_URL,
      expect.objectContaining({ cache: "reload" }),
    );
  });

  it("rejects non-2xx responses", async () => {
    stubFetch(jwksResponse([], { status: 500 }));

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects malformed JSON", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{not-json", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects a response without keys", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects an empty key array", async () => {
    stubFetch(jwksResponse([]));

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects non-object key entries", async () => {
    stubFetch(jwksResponse(["not-an-object"]));

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects private d material", async () => {
    const keyPair = await generatePinningKeyPair();
    const publicJwk = await exportPublicJwk(keyPair);
    stubFetch(jwksResponse([{ ...publicJwk, d: "private-key-material" }]));

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects other private JWK material", async () => {
    const keyPair = await generatePinningKeyPair();
    const publicJwk = await exportPublicJwk(keyPair);
    stubFetch(jwksResponse([{ ...publicJwk, k: "symmetric-key-material" }]));

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("rejects keys that WebCrypto cannot import", async () => {
    stubFetch(
      jwksResponse([
        {
          kty: "EC",
          crv: "P-384",
          x: "not-base64url",
          y: "not-base64url",
        },
      ]),
    );

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });

  it("accepts a valid key among multiple fetched keys", async () => {
    const validKeyPair = await generatePinningKeyPair();
    const otherKeyPair = await generatePinningKeyPair();
    const validJwk = await exportPublicJwk(validKeyPair);
    const otherJwk = await exportPublicJwk(otherKeyPair);
    stubFetch(jwksResponse([otherJwk, validJwk]));

    const keys = await loadPinningKeys(JWKS_URL);

    expect(keys).toHaveLength(2);
    expect(keys[1]).toMatchObject({
      kty: validJwk.kty,
      crv: validJwk.crv,
      x: validJwk.x,
      y: validJwk.y,
    });
  });
});
