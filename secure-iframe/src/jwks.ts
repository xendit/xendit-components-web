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

const JWKS_FETCH_TIMEOUT_MS = 10_000;

const JWKS_ERRORS = {
  missingUrl: "missing jwks url",
  fetchFailed: "jwks fetch failed",
  responseInvalid: "jwks response invalid",
  keyInvalid: "jwks key invalid",
  privateKey: "jwks private key",
  keyImportFailed: "jwks key import failed",
} as const;

export function isJwksErrorCode(code: unknown) {
  return Object.values(JWKS_ERRORS).includes(code as never);
}

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

async function importPublicJwk(key: Record<string, unknown>) {
  if (!isPublicEcP384Jwk(key) || containsPrivateJwkMaterial(key)) {
    return null;
  }

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
    return null;
  }

  return {
    kty: key.kty as string,
    crv: key.crv as string,
    x: key.x as string,
    y: key.y as string,
  } as JsonWebKey;
}

function getFetchUrl(jwksUrl: string, mode: JwksFetchMode) {
  if (mode === "cached") {
    return jwksUrl;
  }

  const url = new URL(jwksUrl);
  url.searchParams.set("xendit_jwks_refresh", Date.now().toString());
  return url.href;
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
  assert(jwksUrl, JWKS_ERRORS.missingUrl);
  const fetchUrl = getFetchUrl(jwksUrl, mode);
  let response: Response;
  try {
    response = await fetch(fetchUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: mode === "refresh" ? "reload" : "default",
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      signal: AbortSignal.timeout(JWKS_FETCH_TIMEOUT_MS),
    });
  } catch {
    assert(false, JWKS_ERRORS.fetchFailed);
  }

  assert(response.ok, JWKS_ERRORS.fetchFailed);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    assert(false, JWKS_ERRORS.responseInvalid);
  }

  assert(isRecord(body), JWKS_ERRORS.responseInvalid);
  assert(Array.isArray(body.keys), JWKS_ERRORS.responseInvalid);
  assert(
    body.keys.length > 0 && body.keys.length <= 100,
    JWKS_ERRORS.responseInvalid,
  );

  const publicKeys: JsonWebKey[] = [];
  for (const key of body.keys) {
    if (!isRecord(key)) {
      continue;
    }

    const publicKey = await importPublicJwk(key);
    if (publicKey) {
      publicKeys.push(publicKey);
    }
  }

  assert(publicKeys.length > 0, JWKS_ERRORS.keyInvalid);
  return publicKeys;
}
