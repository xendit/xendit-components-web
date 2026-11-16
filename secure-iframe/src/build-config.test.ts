import { describe, expect, it } from "vitest";
import {
  assertJwksUrl,
  buildConnectSrcDirective,
  ENVIRONMENT_JWKS_URLS,
  getEnvironmentJwksUrl,
} from "../build-config";

describe("secure iframe build config - JWKS URL", () => {
  it.each([
    [
      "production-live",
      "https://checkout-ui-gateway.xendit.co/.well-known/jwks.json",
    ],
    [
      "production-development",
      "https://checkout-ui-gateway-prod-dev.xendit.co/.well-known/jwks.json",
    ],
    [
      "staging-live",
      "https://checkout-ui-gateway-live.stg.tidnex.dev/.well-known/jwks.json",
    ],
    [
      "staging-development",
      "https://checkout-ui-gateway-dev.stg.tidnex.dev/.well-known/jwks.json",
    ],
    ["local", "https://localhost:4444/jwks.json"],
    ["test", "https://xendit-secure-iframe/jwks.json"],
  ] as const)("selects the full %s URL", (environment, expected) => {
    expect(getEnvironmentJwksUrl(environment)).toBe(expected);
    expect(ENVIRONMENT_JWKS_URLS[environment]).toBe(expected);
  });

  it("builds an exact connect-src directive", () => {
    const url = ENVIRONMENT_JWKS_URLS["production-live"];
    expect(buildConnectSrcDirective(url)).toBe(`connect-src ${url}`);
  });

  it("rejects missing URLs", () => {
    expect(() => assertJwksUrl(undefined)).toThrowError(
      "XENDIT_COMPONENTS_JWKS_URL is missing",
    );
  });

  it("rejects wildcards", () => {
    expect(() =>
      assertJwksUrl("https://checkout-ui-gateway.xendit.co/*"),
    ).toThrowError("must not contain a wildcard");
  });

  it("rejects non-HTTPS production URLs", () => {
    expect(() =>
      assertJwksUrl("http://checkout-ui-gateway.xendit.co/jwks.json"),
    ).toThrowError("must use HTTPS");
  });

  it("allows HTTP only for localhost", () => {
    expect(assertJwksUrl("http://localhost:4444/jwks.json")).toBe(
      "http://localhost:4444/jwks.json",
    );
  });

  it("rejects credentials", () => {
    expect(() =>
      assertJwksUrl(
        "https://user:secret@checkout-ui-gateway.xendit.co/jwks.json",
      ),
    ).toThrowError("must not contain credentials");
  });

  it("rejects query strings and fragments", () => {
    expect(() =>
      assertJwksUrl(
        "https://checkout-ui-gateway.xendit.co/jwks.json?redirect=1",
      ),
    ).toThrowError("must not contain a query or fragment");
    expect(() =>
      assertJwksUrl("https://checkout-ui-gateway.xendit.co/jwks.json#x"),
    ).toThrowError("must not contain a query or fragment");
  });

  it("rejects a broad origin without a path", () => {
    expect(() =>
      assertJwksUrl("https://checkout-ui-gateway.xendit.co"),
    ).toThrowError("must include an exact path");
  });
});
