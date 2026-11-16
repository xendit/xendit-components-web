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
import { fileURLToPath } from "node:url";
import {
  assertJwksUrl,
  buildConnectSrcDirective,
  DEFAULT_LOCAL_JWKS_URL,
} from "./build-config.ts";

const PORT = 4444;

// environment variables to be replaced e.g. process.env.XENDIT_COMPONENTS_VERSION -> "v1.2.3"
function buildEnvs(jwksUrl: string) {
  return {
    NODE_ENV: "production",
    XENDIT_COMPONENTS_JWKS_URL: jwksUrl,
  };
}

function resolveJwksUrl() {
  const configured = process.env.XENDIT_COMPONENTS_JWKS_URL;
  if (configured) {
    return assertJwksUrl(configured);
  }
  if (process.env.CI) {
    throw new Error("XENDIT_COMPONENTS_JWKS_URL is missing");
  }
  return assertJwksUrl(DEFAULT_LOCAL_JWKS_URL);
}

let lastSeenBuildOutput: string | null = null;
let devSigningJwk: JsonWebKey | null = null;

async function getDevSigningJwk() {
  if (!devSigningJwk) {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-384",
      },
      true,
      ["sign", "verify"],
    );
    devSigningJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  }
  return devSigningJwk;
}

function publicJwk(key: JsonWebKey): JsonWebKey {
  return {
    kty: key.kty,
    crv: key.crv,
    x: key.x,
    y: key.y,
  };
}

export function generateIframeHtml(js: string, jwksUrl: string) {
  const connectSrcDirective = buildConnectSrcDirective(jwksUrl);

  // Calculate hash of the js for CSP
  const jsHash = crypto.createHash("sha256").update(js).digest("base64");

  // generate html
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <meta http-equiv="Content-Security-Policy" content="${connectSrcDirective}"/>
    <title>Xendit Secure Iframe</title>
    <style>
      :root { --xendit-iframe-placeholder-color: #7d7d7d; }
      input::placeholder { color: var(--xendit-iframe-placeholder-color); }
    </style>
  </head>
  <body>
    <script type="application/javascript">${js}</script>
  </body>
</html>
`;

  return { html, jsHash, connectSrcDirective };
}

function rollupConfig(
  production: boolean,
  jwksUrl: string,
): rollup.RollupOptions {
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
          Object.entries(buildEnvs(jwksUrl)).map(([key, value]) => [
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

async function completeRollupBuild(build: rollup.RollupBuild, jwksUrl: string) {
  const bundleSource = await build.generate({});
  if (bundleSource.output.length !== 1) {
    throw new Error(
      `Expected single output from rollup, got ${bundleSource.output.length}`,
    );
  }
  const code = bundleSource.output[0].code;
  return await generateIframeHtml(code, jwksUrl);
}

async function rollupProductionBuild(jwksUrl: string) {
  const options = rollupConfig(true, jwksUrl);
  const build = await rollup.rollup(options);
  const result = await completeRollupBuild(build, jwksUrl);

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

  // Write CSP metadata for the response-header/CDN configuration owner
  await fs.writeFile(
    path.join(import.meta.dirname, "dist/csp-connect-src.txt"),
    result.connectSrcDirective,
  );
  await fs.writeFile(
    path.join(import.meta.dirname, "dist/jwks-url.txt"),
    assertJwksUrl(jwksUrl),
  );
}

async function rollupWatch(jwksUrl: string) {
  const options = rollupConfig(false, jwksUrl);
  const watcher = rollup.watch(options);

  watcher.on("event", async (event) => {
    switch (event.code) {
      case "BUNDLE_END": {
        if (event.result) {
          const result = await completeRollupBuild(event.result, jwksUrl);
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
    case "GET /jwks.json": {
      const signingJwk = await getDevSigningJwk();
      res
        .writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        })
        .end(JSON.stringify({ keys: [publicJwk(signingJwk)] }));
      return;
    }
    case "GET /pinning-keys.json": {
      const signingJwk = await getDevSigningJwk();
      res
        .writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        })
        .end(JSON.stringify([signingJwk]));
      return;
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

const rootBuildScript = path.resolve(import.meta.dirname, "../build.ts");
const isCliEntrypoint =
  process.argv[1] !== undefined &&
  (path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) ||
    path.resolve(process.argv[1]) === rootBuildScript);

if (isCliEntrypoint) {
  const jwksUrl = resolveJwksUrl();

  switch (process.argv[2]) {
    case "dev": {
      await Promise.all([rollupWatch(jwksUrl), startDevServer()]).catch(
        (err) => {
          console.error("Error in dev mode:", err);
          process.exit(1);
        },
      );
      break;
    }
    case "prod": {
      await rollupProductionBuild(jwksUrl).catch((err) => {
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
}
