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

    expect(fetchMock).toHaveBeenCalledWith(
      JWKS_URL,
      expect.objectContaining({ cache: "reload" }),
    );
  });

  it.each([
    ["non-2xx response", {}, 500],
    ["missing keys", {}, 200],
    ["empty keys", { keys: [] }, 200],
    [
      "private key material",
      { keys: [{ ...publicKeys[0], d: "private" }] },
      200,
    ],
  ])("rejects %s", async (_case, body, status) => {
    stubFetch(body, status);

    await expect(loadPinningKeys(JWKS_URL)).rejects.toThrowError(
      "Assertion failure",
    );
  });
});
