export const JWKS_PATH = "/.well-known/jwks.json";

export const ENVIRONMENT_JWKS_URLS = {
  "production-live": `https://checkout-ui-gateway.xendit.co${JWKS_PATH}`,
  "production-development": `https://checkout-ui-gateway-prod-dev.xendit.co${JWKS_PATH}`,
  "staging-live": `https://checkout-ui-gateway-live.stg.tidnex.dev${JWKS_PATH}`,
  "staging-development": `https://checkout-ui-gateway-dev.stg.tidnex.dev${JWKS_PATH}`,
  local: "https://localhost:4444/jwks.json",
  test: "https://xendit-secure-iframe/jwks.json",
} as const;

export type BuildEnvironment = keyof typeof ENVIRONMENT_JWKS_URLS;

export const DEFAULT_LOCAL_JWKS_URL = ENVIRONMENT_JWKS_URLS.local;

export function getEnvironmentJwksUrl(environment: BuildEnvironment): string {
  return ENVIRONMENT_JWKS_URLS[environment];
}

/**
 * Validates a build-configured JWKS URL.
 *
 * The URL must be a full, credential-free URL with a path. Production URLs
 * must use HTTPS. Plain HTTP is only allowed for local development.
 */
export function assertJwksUrl(value: string | undefined): string {
  if (!value) {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL is missing");
  }
  if (value.includes("*")) {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL must not contain a wildcard");
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL must be a full URL");
  }

  const isLocalHost =
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "[::1]";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocalHost)) {
    throw new Error(
      "XENDIT_COMPONENTS_JWKS_URL must use HTTPS, except for localhost",
    );
  }
  if (url.username || url.password) {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL must not contain credentials");
  }
  if (url.search || url.hash) {
    throw new Error(
      "XENDIT_COMPONENTS_JWKS_URL must not contain a query or fragment",
    );
  }
  if (url.pathname === "/" || url.pathname === "") {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL must include an exact path");
  }

  return url.href;
}

export function buildConnectSrcDirective(jwksUrl: string): string {
  return `connect-src ${assertJwksUrl(jwksUrl)}`;
}
