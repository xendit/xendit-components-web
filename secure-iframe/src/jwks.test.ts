import { afterEach, describe, expect, it, vi } from "vitest";
import testPinningKeys from "../../test-pinning-keys.json";
import { loadPinningKeys } from "./jwks";

const JWKS_URL = "https://assets.xendit.co/components/jwk.json";
const publicKeys = testPinningKeys.map(({ kty, crv, x, y }) => ({
  kty,
  crv,
  x,
  y,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("secure iframe jwks", () => {
  it("loads and validates public keys", async () => {
    const fetchMock = stubFetch({ keys: publicKeys });

    await expect(loadPinningKeys(JWKS_URL)).resolves.toEqual(publicKeys);
    expect(fetchMock).toHaveBeenCalledWith(
      JWKS_URL,
      expect.objectContaining({
        cache: "default",
        credentials: "omit",
        redirect: "error",
      }),
    );
  });

  it("reloads the JWKS when requested", async () => {
    const fetchMock = stubFetch({ keys: publicKeys });

    await loadPinningKeys(JWKS_URL, "refresh");

    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(url).toMatch(
      /^https:\/\/assets\.xendit\.co\/components\/jwk\.json\?xendit_jwks_refresh=\d+$/,
    );
    expect(options).toMatchObject({ cache: "reload" });
  });

  it.each([
    ["non-2xx response", {}, 500, "jwks fetch failed"],
    ["missing keys", {}, 200, "jwks response invalid"],
    ["empty keys", { keys: [] }, 200, "jwks response invalid"],
    [
      "private key material",
      { keys: [{ ...publicKeys[0], d: "private" }] },
      200,
      "jwks private key",
    ],
    [
      "invalid key shape",
      { keys: [{ kty: "RSA", n: "not-used", e: "not-used" }] },
      200,
      "jwks key invalid",
    ],
  ])("rejects %s", async (_case, body, status, errorCode) => {
    stubFetch(body, status);

    try {
      await loadPinningKeys(JWKS_URL);
      throw new Error("expected loadPinningKeys to fail");
    } catch (error) {
      expect(error).toMatchObject({ code: errorCode });
    }
  });
});
