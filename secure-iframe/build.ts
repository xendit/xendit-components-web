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
const DEFAULT_JWK_URL = "https://assets.xendit.co/components/jwk.json";
const DEFAULT_LOCAL_JWK_URL = "https://localhost:4444/jwks.json";

// environment variables to be replaced e.g. process.env.XENDIT_COMPONENTS_VERSION -> "v1.2.3"
function resolveJwkUrl() {
  const configuredUrl = process.env.XENDIT_COMPONENTS_JWK_URL;
  if (!configuredUrl && process.argv[2] === "dev") {
    return DEFAULT_LOCAL_JWK_URL;
  }

  const jwkUrl = configuredUrl ?? DEFAULT_JWK_URL;
  let url: URL;
  try {
    url = new URL(jwkUrl);
  } catch {
    throw new Error(`Invalid components jwk url: ${jwkUrl}`);
  }

  const isLocalUrl = url.hostname === "localhost";
  if (
    (isLocalUrl && url.protocol !== "https:") ||
    (!isLocalUrl &&
      (url.protocol !== "https:" || url.hostname !== "assets.xendit.co"))
  ) {
    throw new Error(
      "Components jwk url must use HTTPS and the assets.xendit.co hostname",
    );
  }

  return jwkUrl;
}

function buildEnvs(jwkUrl: string) {
  return {
    NODE_ENV: "production",
    XENDIT_COMPONENTS_JWK_URL: jwkUrl,
  };
}

let lastSeenBuildOutput: string | null = null;

async function generateIframeHtml(js: string) {
  // Calculate hash of the unmodified JS. Keys are loaded at runtime.
  const jsHash = crypto.createHash("sha256").update(js).digest("base64");

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
    <script type="application/javascript">${js}</script>
  </body>
</html>
`;

  return { html, jsHash };
}

function rollupConfig(production: boolean): rollup.RollupOptions {
  const jwkUrl = resolveJwkUrl();

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
          Object.entries(buildEnvs(jwkUrl)).map(([key, value]) => [
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
    case "GET /jwks.json": {
      const testKeys = JSON.parse(
        await fs.readFile(
          path.join(import.meta.dirname, "../test-pinning-keys.json"),
          "utf-8",
        ),
      ) as JsonWebKey[];
      const publicKeys = testKeys.map(({ kty, crv, x, y }) => ({
        kty,
        crv,
        x,
        y,
      }));
      res
        .writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        })
        .end(JSON.stringify({ keys: publicKeys }));
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
