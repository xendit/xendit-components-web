import * as fs from "node:fs/promises";
import * as path from "node:path";

const MIGRATED_MAIN_IMPORT = 'import { loadPinningKeys } from "./jwks";';

export function patchMainSource(source: string): string {
  if (source.includes("loadPinningKeys(")) {
    return source;
  }

  let patched = source;
  const macroPattern =
    /\/\/ @ts-expect-error[^\n]*\nconst masterPinningKeys: JsonWebKey\[\] = PINNING_KEYS_MACRO;\n/;
  if (!macroPattern.test(patched)) {
    throw new Error("Could not find the legacy pinning key macro");
  }
  patched = patched.replace(macroPattern, `${MIGRATED_MAIN_IMPORT}\n`);

  const assertPattern =
    'assert(masterPinningKeys.length > 0, "missing pinning keys");';
  if (!patched.includes(assertPattern)) {
    throw new Error("Could not find the legacy pinning key assertion");
  }
  patched = patched.replace(
    assertPattern,
    'const jwksUrl = process.env.XENDIT_COMPONENTS_JWKS_URL;\n  assert(jwksUrl, "missing jwks url");',
  );

  const pinPattern = `  // pin public key
  await pin(
    masterPinningKeys,
    serverPublicKeySignatureBytes,
    serverPublicKeyBytes,
  );`;
  if (!patched.includes(pinPattern)) {
    throw new Error("Could not find the legacy pin call");
  }
  patched = patched.replace(
    pinPattern,
    `  // pin public key, retrying once with a fresh JWKS after a verification failure
  const pinningKeys = await loadPinningKeys(jwksUrl);
  try {
    await pin(
      pinningKeys,
      serverPublicKeySignatureBytes,
      serverPublicKeyBytes,
    );
  } catch {
    const refreshedPinningKeys = await loadPinningKeys(jwksUrl, "refresh");
    await pin(
      refreshedPinningKeys,
      serverPublicKeySignatureBytes,
      serverPublicKeyBytes,
    );
  }`,
  );

  return patched;
}

function migratedGenerateIframeHtml() {
  return `async function generateIframeHtml(js: string) {
  const jwksUrl = process.env.XENDIT_COMPONENTS_JWKS_URL;
  if (!jwksUrl) {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL is missing");
  }
  const connectSrcDirective = \`connect-src \${jwksUrl}\`;

  // Calculate hash of the js for CSP
  const jsHash = crypto.createHash("sha256").update(js).digest("base64");

  // generate html
  const html = \`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <meta http-equiv="Content-Security-Policy" content="\${connectSrcDirective}"/>
    <title>Xendit Secure Iframe</title>
    <style>
      :root { --xendit-iframe-placeholder-color: #7d7d7d; }
      input::placeholder { color: var(--xendit-iframe-placeholder-color); }
    </style>
  </head>
  <body>
    <script type="application/javascript">\${js}</script>
  </body>
</html>
\`;

  return { html, jsHash, connectSrcDirective };
}`;
}

export function patchBuildSource(source: string): string {
  if (
    source.includes("connectSrcDirective") &&
    !source.includes("pinningKeysRaw")
  ) {
    return source;
  }

  let patched = source;
  const destructurePattern =
    "const { XENDIT_COMPONENTS_PINNING_KEYS } = process.env;";
  if (!patched.includes(destructurePattern)) {
    throw new Error("Could not find the legacy pinning key environment");
  }
  patched = patched.replace(
    destructurePattern,
    "const { XENDIT_COMPONENTS_JWKS_URL } = process.env;",
  );

  const envsPattern = `const envs = {
  NODE_ENV: "production",
};`;
  if (!patched.includes(envsPattern)) {
    throw new Error("Could not find the rollup environment configuration");
  }
  patched = patched.replace(
    envsPattern,
    `const envs = {
  NODE_ENV: "production",
  XENDIT_COMPONENTS_JWKS_URL,
};`,
  );

  const functionStart = patched.indexOf(
    "async function generateIframeHtml(js: string) {",
  );
  const functionEnd = patched.indexOf("\nfunction rollupConfig", functionStart);
  if (functionStart === -1 || functionEnd === -1) {
    throw new Error("Could not find the legacy iframe HTML generator");
  }
  patched =
    patched.slice(0, functionStart) +
    migratedGenerateIframeHtml() +
    patched.slice(functionEnd);

  return patched;
}

export async function applyMigrationToWorktree(
  worktree: string,
  currentRepoRoot: string,
) {
  const secureIframeDir = path.join(worktree, "secure-iframe");
  const srcDir = path.join(secureIframeDir, "src");

  const jwksSource = await fs.readFile(
    path.join(currentRepoRoot, "secure-iframe/src/jwks.ts"),
    "utf-8",
  );
  await fs.writeFile(path.join(srcDir, "jwks.ts"), jwksSource);

  const mainPath = path.join(srcDir, "main.ts");
  const mainSource = await fs.readFile(mainPath, "utf-8");
  await fs.writeFile(mainPath, patchMainSource(mainSource));

  const buildPath = path.join(secureIframeDir, "build.ts");
  const buildSource = await fs.readFile(buildPath, "utf-8");
  await fs.writeFile(buildPath, patchBuildSource(buildSource));

  const migratedMain = await fs.readFile(mainPath, "utf-8");
  const migratedBuild = await fs.readFile(buildPath, "utf-8");
  if (
    migratedMain.includes("PINNING_KEYS_MACRO") ||
    migratedMain.includes("XENDIT_COMPONENTS_PINNING_KEYS") ||
    migratedBuild.includes("PINNING_KEYS_MACRO") ||
    migratedBuild.includes("XENDIT_COMPONENTS_PINNING_KEYS")
  ) {
    throw new Error("Migration left build-time pinning key references behind");
  }
}
