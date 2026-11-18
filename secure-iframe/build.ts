#!/usr/bin/env -S node --experimental-transform-types

import * as https from "https";
import * as http from "http";
import * as fs from "fs/promises";
import * as path from "path";
import { mkdirSync, readFileSync } from "fs";
import * as crypto from "crypto";
import * as rollup from "rollup";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { stripTypeScriptTypes } from "module";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

const PORT = 4444;
const PINNING_KEYS_URL =
  process.env.XENDIT_COMPONENTS_JWK_URL ??
  "https://assets.xendit.co/components/jwk.json";
const PINNING_KEYS_FETCH_ATTEMPTS = 3;
const PINNING_KEYS_FETCH_TIMEOUT_MS = 10_000;
const MAX_PINNING_KEYS = 100;
const USE_TEST_PINNING_KEYS =
  process.argv[2] === "dev" ||
  process.env.XENDIT_COMPONENTS_USE_TEST_PINNING_KEYS === "1";

// environment variables to be replaced e.g. process.env.XENDIT_COMPONENTS_VERSION -> "v1.2.3"
const envs = {
  NODE_ENV: "production",
};

let lastSeenBuildOutput: string | null = null;

function validatePinningKeys(
  value: unknown,
  allowPrivateKeys = false,
): JsonWebKey[] {
  if (
    typeof value !== "object" ||
    value === null ||
    !Array.isArray((value as { keys?: unknown }).keys)
  ) {
    throw new Error("Pinning keys response must contain a keys array");
  }

  const keys = (value as { keys: unknown[] }).keys;
  if (keys.length === 0 || keys.length > MAX_PINNING_KEYS) {
    throw new Error(
      `Pinning keys response must contain between 1 and ${MAX_PINNING_KEYS} keys`,
    );
  }

  return keys.map((key, index) => {
    if (typeof key !== "object" || key === null) {
      throw new Error(`Pinning key at index ${index} is invalid`);
    }

    const jwk = key as JsonWebKey;
    if (jwk.d && !allowPrivateKeys) {
      throw new Error(`Private key found at pinning key index ${index}`);
    }
    if (
      jwk.kty !== "EC" ||
      jwk.crv !== "P-384" ||
      typeof jwk.x !== "string" ||
      typeof jwk.y !== "string"
    ) {
      throw new Error(
        `Pinning key at index ${index} must be an EC P-384 public key`,
      );
    }

    return jwk;
  });
}

async function fetchPinningKeys() {
  let lastError: unknown;

  for (let attempt = 1; attempt <= PINNING_KEYS_FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(PINNING_KEYS_URL, {
        signal: AbortSignal.timeout(PINNING_KEYS_FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return validatePinningKeys(await response.json());
    } catch (error) {
      lastError = error;
      if (attempt < PINNING_KEYS_FETCH_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1_000 * attempt));
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `Failed to fetch pinning keys from ${PINNING_KEYS_URL}: ${message}`,
  );
}

async function resolvePinningKeys() {
  if (USE_TEST_PINNING_KEYS) {
    const testKeys = JSON.parse(
      await fs.readFile(
        path.join(import.meta.dirname, "../test-pinning-keys.json"),
        "utf-8",
      ),
    );
    return validatePinningKeys({ keys: testKeys }, true);
  }

  return await fetchPinningKeys();
}

function publicPinningKeys(keys: JsonWebKey[]) {
  return keys
    .map((key) => ({
      kty: key.kty,
      crv: key.crv,
      x: key.x,
      y: key.y,
    }))
    .sort((left, right) =>
      `${left.x}:${left.y}`.localeCompare(`${right.x}:${right.y}`),
    );
}

async function generateIframeHtml(js: string) {
  const pinningKeysRaw = await resolvePinningKeys();

  // Parse and process pinning keys
  const pinningKeys = publicPinningKeys(pinningKeysRaw);
  const jsWithPinningKeys = js.replace(
    /PINNING_KEYS_MACRO/,
    JSON.stringify(pinningKeys),
  );
  if (js === jsWithPinningKeys) {
    throw new Error("Failed to replace PINNING_KEYS_MACRO in JS code");
  }

  // Calculate hash of the jsWithPinningKeys for CSP
  const jsHash = crypto
    .createHash("sha256")
    .update(jsWithPinningKeys)
    .digest("base64");

  // generate html
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <title>Xendit Secure Iframe</title>
    <style>
      :root { --xendit-iframe-placeholder-color: #7d7d7d; }
      input::placeholder { color: var(--xendit-iframe-placeholder-color); }
    </style>
  </head>
  <body>
    <script type="application/javascript">${jsWithPinningKeys}</script>
  </body>
</html>
`;

  return { html, jsHash, pinningKeys };
}

function rollupConfig(production: boolean): rollup.RollupOptions {
  return {
    input: path.join(import.meta.dirname, "src/entry.ts"),
    output: {
      file: "dist/not-a-real-file.js",
      format: "cjs",
    },
    watch: {
      skipWrite: true,
    },
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs({
        include: ["**/node_modules/**"],
      }),
      replace({
        preventAssignment: true,
        ...Object.fromEntries(
          Object.entries(envs).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value),
          ]),
        ),
      }),
      typescript({
        tsconfig: path.join(import.meta.dirname, "../tsconfig.json"),
        compilerOptions: {
          module: "esnext",
          noEmitOnError: false,
        },
      }),
      production ? terser() : null,
    ].filter(Boolean),
  };
}

async function completeRollupBuild(build: rollup.RollupBuild) {
  const bundleSource = await build.generate({});
  if (bundleSource.output.length !== 1) {
    throw new Error(
      `Expected single output from rollup, got ${bundleSource.output.length}`,
    );
  }
  const code = bundleSource.output[0].code;
  return await generateIframeHtml(code);
}

async function rollupProductionBuild() {
  const options = rollupConfig(true);
  const build = await rollup.rollup(options);
  const result = await completeRollupBuild(build);

  mkdirSync(path.join(import.meta.dirname, "dist"), { recursive: true });
  await fs.writeFile(
    path.join(import.meta.dirname, "dist/secure-iframe.html"),
    result.html,
  );

  // Write hash metadata for deployment script
  await fs.writeFile(
    path.join(import.meta.dirname, "dist/js-hash.txt"),
    result.jsHash,
  );
  await fs.writeFile(
    path.join(import.meta.dirname, "dist/pinning-keys.resolved.json"),
    `${JSON.stringify(result.pinningKeys, null, 2)}\n`,
  );
}

async function rollupWatch() {
  const options = rollupConfig(false);
  const watcher = rollup.watch(options);

  watcher.on("event", async (event) => {
    switch (event.code) {
      case "BUNDLE_END": {
        if (event.result) {
          const result = await completeRollupBuild(event.result);
          lastSeenBuildOutput = result.html;
          await event.result.close();
        }
        break;
      }
      case "END": {
        console.log("Rollup build completed");
        break;
      }
      case "ERROR": {
        console.error("Rollup error:", event.error);
        break;
      }
    }
  });
}

async function generateTestPage() {
  const code = await fs.readFile(
    path.join(import.meta.dirname, "test-ui.cts"),
    "utf-8",
  );
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Xendit Secure Iframe Test Page</title>
  </head>
  <body>
    <script type="application/javascript">${stripTypeScriptTypes(code)}</script>
  </body>
</html>`;
}

async function handleDevServerRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  const pathname = new URL(`http://example.com${req.url}`).pathname;

  async function serveFileFromDisk(filename: string, mime: string) {
    const file = await fs.readFile(path.join(import.meta.dirname, filename));
    res.writeHead(200, { "Content-Type": mime });
    res.end(file);
  }

  switch (`${req.method} ${pathname}`) {
    case "GET /": {
      res
        .writeHead(200, { "Content-Type": "text/html" })
        .end(await generateTestPage());
      return;
    }
    case "GET /secure-iframe.html": {
      if (!lastSeenBuildOutput) {
        res
          .writeHead(503, { "Content-Type": "text/plain" })
          .end("Build not ready");
        return;
      }
      res
        .writeHead(200, { "Content-Type": "text/html" })
        .end(lastSeenBuildOutput);
      return;
    }
    case "GET /pinning-keys.json": {
      return await serveFileFromDisk(
        "../test-pinning-keys.json",
        "application/json",
      );
    }
    case "GET /favicon.ico": {
      res.writeHead(201, {}).end();
      return;
    }
    default: {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("404 Not Found");
      return;
    }
  }
}

async function startDevServer() {
  const keyDir = path.join(import.meta.dirname, "..");
  const server = https.createServer(
    {
      key: readFileSync(path.join(keyDir, "test-key.pem")),
      cert: readFileSync(path.join(keyDir, "test-cert.pem")),
    },
    (req, res) => {
      handleDevServerRequest(req, res).catch((err) => {
        console.error(err);
        res.end();
      });
    },
  );

  server.listen(PORT, () => {
    console.log(`Server for secure-iframe at https://localhost:${PORT}/`);
  });
}

switch (process.argv[2]) {
  case "dev": {
    await Promise.all([rollupWatch(), startDevServer()]).catch((err) => {
      console.error("Error in dev mode:", err);
      process.exit(1);
    });
    break;
  }
  case "prod": {
    await rollupProductionBuild().catch((err) => {
      console.error("Error in production build:", err);
      process.exit(1);
    });
    break;
  }
  default: {
    console.error(
      `Usage: ${process.argv[1]} dev|prod\n` +
        "  dev - start development server (rebuilds when you change any file)\n" +
        "  prod - build production version",
    );
    process.exit(1);
  }
}
