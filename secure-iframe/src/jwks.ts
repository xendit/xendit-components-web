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

function containsPrivateJwkMaterial(key: Record<string, unknown>) {
  return PRIVATE_JWK_FIELDS.some(
    (field) => key[field] !== undefined && key[field] !== null,
  );
}

function isPublicEcP384Jwk(key: Record<string, unknown>) {
  return (
    key.kty === "EC" &&
    key.crv === "P-384" &&
    typeof key.x === "string" &&
    key.x.length > 0 &&
    typeof key.y === "string" &&
    key.y.length > 0
  );
}

async function validatePublicJwk(key: Record<string, unknown>) {
  assert(!containsPrivateJwkMaterial(key), "invalid jwks");
  assert(isPublicEcP384Jwk(key), "invalid jwks");

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
 * Fetches the public keys used to pin the invoice service key.
 *
 * A refresh bypasses the browser cache so key rotation can recover from a
 * signature mismatch without requiring a page reload.
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
      headers: { Accept: "application/json" },
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

  assert(isRecord(body), "invalid jwks");
  assert(Array.isArray(body.keys), "invalid jwks");
  assert(body.keys.length > 0 && body.keys.length <= 100, "invalid jwks");

  const publicKeys: JsonWebKey[] = [];
  for (const key of body.keys) {
    assert(isRecord(key), "invalid jwks");
    await validatePublicJwk(key);
    publicKeys.push({
      kty: key.kty as string,
      crv: key.crv as string,
      x: key.x as string,
      y: key.y as string,
    });
  }

  return publicKeys;
}
