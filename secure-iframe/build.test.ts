import * as crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { generateIframeHtml } from "./build";
import { ENVIRONMENT_JWKS_URLS } from "./build-config";

describe("secure iframe build - generated HTML", () => {
  const jwksUrl = ENVIRONMENT_JWKS_URLS["production-live"];
  const js = "console.log('iframe');";

  it("contains the exact JWKS URL in connect-src", () => {
    const { html, connectSrcDirective } = generateIframeHtml(js, jwksUrl);

    expect(connectSrcDirective).toBe(`connect-src ${jwksUrl}`);
    expect(html).toContain(
      `<meta http-equiv="Content-Security-Policy" content="connect-src ${jwksUrl}"/>`,
    );
    expect(html).not.toContain("connect-src *");
  });

  it("hashes the generated script for the existing CSP hash flow", () => {
    const { html, jsHash } = generateIframeHtml(js, jwksUrl);
    const expectedHash = crypto
      .createHash("sha256")
      .update(js)
      .digest("base64");

    expect(jsHash).toBe(expectedHash);
    expect(html).toContain(
      `<script type="application/javascript">${js}</script>`,
    );
  });

  it.each(Object.entries(ENVIRONMENT_JWKS_URLS))(
    "embeds the exact %s JWKS URL",
    (_environment, jwksUrl) => {
      const { html } = generateIframeHtml(js, jwksUrl);

      expect(html).toContain(`connect-src ${jwksUrl}`);
      expect(html).toContain(jwksUrl);
    },
  );

  it("does not contain build-time pinning key placeholders", () => {
    const { html } = generateIframeHtml(js, jwksUrl);

    expect(html).not.toContain("PINNING_KEYS_MACRO");
    expect(html).not.toContain("XENDIT_COMPONENTS_PINNING_KEYS");
  });
});
