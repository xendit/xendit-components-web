import { assert } from "./utils";

const PRIVATE_JWK_FIELDS = [
  "d",
  "p",
  "q",
  "dp",
  "dq",
  "qi",
  "oth",
  "k",
] as const;

type JwksFetchMode = "cached" | "refresh";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertRecord(
  value: unknown,
): asserts value is Record<string, unknown> {
  if (!isRecord(value)) {
    assert(false, "invalid jwks");
  }
}

function containsPrivateJwkMaterial(key: Record<string, unknown>) {
  return PRIVATE_JWK_FIELDS.some(
    (field) => key[field] !== undefined && key[field] !== null,
  );
}

function isPublicEcP384Jwk(key: Record<string, unknown>): boolean {
  return (
    key.kty === "EC" &&
    key.crv === "P-384" &&
    typeof key.x === "string" &&
    key.x.length > 0 &&
    typeof key.y === "string" &&
    key.y.length > 0
  );
}

async function importPublicJwk(key: Record<string, unknown>) {
  try {
    await crypto.subtle.importKey(
      "jwk",
      {
        kty: key.kty,
        crv: key.crv,
        x: key.x,
        y: key.y,
        key_ops: ["verify"],
      } as JsonWebKey,
      {
        name: "ECDSA",
        namedCurve: "P-384",
      },
      false,
      ["verify"],
    );
  } catch {
    assert(false, "invalid jwks");
  }
}

/**
 * Fetches and validates the public JWKS used to pin the invoice service key.
 *
 * The first attempt uses the browser cache. A refresh explicitly bypasses the
 * HTTP cache, allowing the caller to retry once after a signature mismatch.
 */
export async function loadPinningKeys(
  jwksUrl: string,
  mode: JwksFetchMode = "cached",
): Promise<JsonWebKey[]> {
  assert(jwksUrl, "missing jwks url");

  let response: Response;
  try {
    response = await fetch(jwksUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: mode === "refresh" ? "reload" : "default",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
  } catch {
    assert(false, "jwks fetch failed");
  }

  assert(response.ok, "jwks fetch failed");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    assert(false, "invalid jwks");
  }

  assertRecord(body);
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    assert(false, "invalid jwks");
  }

  const publicKeys: JsonWebKey[] = [];
  for (const key of body.keys) {
    assertRecord(key);
    assert(!containsPrivateJwkMaterial(key), "invalid jwks");
    assert(isPublicEcP384Jwk(key), "invalid jwks");

    await importPublicJwk(key);

    const publicKey = key as JsonWebKey;
    publicKeys.push({
      kty: publicKey.kty,
      crv: publicKey.crv,
      x: publicKey.x,
      y: publicKey.y,
    });
  }

  return publicKeys;
}
