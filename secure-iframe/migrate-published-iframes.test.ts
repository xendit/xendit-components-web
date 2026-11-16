import { readFileSync } from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  patchBuildSource,
  patchMainSource,
} from "./migrate-published-iframes-lib";

const secureIframeDir = import.meta.dirname;

const legacyMain = `import { pin } from "./crypto";
import { arrayBufferToBase64, assert, base64ToArrayBuffer } from "./utils";

// @ts-expect-error This macro is replaced with a JSON array by the build script
const masterPinningKeys: JsonWebKey[] = PINNING_KEYS_MACRO;

export async function main() {
  assert(masterPinningKeys.length > 0, "missing pinning keys");

  // pin public key
  await pin(
    masterPinningKeys,
    serverPublicKeySignatureBytes,
    serverPublicKeyBytes,
  );
}
`;

const legacyBuild = `const { XENDIT_COMPONENTS_PINNING_KEYS } = process.env;

const envs = {
  NODE_ENV: "production",
};

async function generateIframeHtml(js: string) {
  let pinningKeysRaw: JsonWebKey[];
  const jsWithPinningKeys = js.replace(/PINNING_KEYS_MACRO/, "[]");
  const jsHash = crypto
    .createHash("sha256")
    .update(jsWithPinningKeys)
    .digest("base64");
  return { html: jsWithPinningKeys, jsHash };
}

function rollupConfig() {
  return {};
}
`;

describe("secure iframe migration", () => {
  it("lists all supported legacy iframe versions", () => {
    const versions = readFileSync(
      path.join(secureIframeDir, "supported-versions.txt"),
      "utf-8",
    )
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(versions[0]).toBe("v0.0.15");
    expect(versions[versions.length - 1]).toBe("v0.0.41");
    for (const version of versions) {
      expect(version).toMatch(/^v\d+\.\d+\.\d+$/);
    }
  });

  it("points the migration pipeline at the supported version list", () => {
    const script = readFileSync(
      path.join(secureIframeDir, "migrate-published-iframes.ts"),
      "utf-8",
    );

    expect(script).toContain("supported-versions.txt");
    expect(script).toContain("XENDIT_COMPONENTS_JWKS_URL");
    expect(script).toContain("secure-iframe-${version}.html");
  });

  it("migrates legacy main source to runtime JWKS fetching", () => {
    const migrated = patchMainSource(legacyMain);

    expect(migrated).toContain('import { loadPinningKeys } from "./jwks";');
    expect(migrated).toContain(
      "const jwksUrl = process.env.XENDIT_COMPONENTS_JWKS_URL;",
    );
    expect(migrated).toContain("loadPinningKeys(jwksUrl)");
    expect(migrated).toContain('loadPinningKeys(jwksUrl, "refresh")');
    expect(migrated).not.toContain("PINNING_KEYS_MACRO");
    expect(migrated).not.toContain("XENDIT_COMPONENTS_PINNING_KEYS");
  });

  it("is idempotent for an already migrated main source", () => {
    const migrated = patchMainSource(legacyMain);
    expect(patchMainSource(migrated)).toBe(migrated);
  });

  it("migrates legacy build source to a runtime JWKS URL and CSP", () => {
    const migrated = patchBuildSource(legacyBuild);

    expect(migrated).toContain("XENDIT_COMPONENTS_JWKS_URL");
    expect(migrated).toContain("connect-src");
    expect(migrated).not.toContain("PINNING_KEYS_MACRO");
    expect(migrated).not.toContain("XENDIT_COMPONENTS_PINNING_KEYS");
    expect(migrated).not.toContain("pinningKeysRaw");
  });

  it("is idempotent for an already migrated build source", () => {
    const migrated = patchBuildSource(legacyBuild);
    expect(patchBuildSource(migrated)).toBe(migrated);
  });
});
