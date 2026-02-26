#!/usr/bin/env -S node --experimental-transform-types

import typescript from "@rollup/plugin-typescript";
import path from "path";
import * as rollup from "rollup";
import terser from "@rollup/plugin-terser";
import { createServer } from "https";
import { readFileSync } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import { readFile } from "fs/promises";
import resolve from "@rollup/plugin-node-resolve";
import { stripTypeScriptTypes } from "module";
import css from "rollup-plugin-import-css";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import { codecovRollupPlugin } from "@codecov/rollup-plugin";
import { createReadStream, existsSync } from "fs";
import mime from "mime-types";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import assert from "assert";

const SDK_PORT = 4443;

let lastSeenBuildOutput: Map<string, Buffer> | null = null;

const packageJson = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "../package.json"), "utf-8"),
) as typeof import("../package.json");
const checkoutUiGatewayHosts = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "../hosts.json"), "utf-8"),
);

if (process.env.CI) {
  // in prod builds, validate env vars
  assert(
    process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL,
    "env XENDIT_COMPONENTS_SECURE_IFRAME_URL is missing",
  );
  assert(
    process.env.XENDIT_COMPONENTS_VERSION,
    "env XENDIT_COMPONENTS_VERSION is missing",
  );
  assert(
    process.env.XENDIT_COMPONENTS_VERSION === "v0.0.0" ||
      process.env.XENDIT_COMPONENTS_VERSION === `v${packageJson.version}`,
    `env XENDIT_COMPONENTS_VERSION does not match package.json, expected v${packageJson.version} but got ${process.env.XENDIT_COMPONENTS_VERSION}`,
  );
} else {
  // dev mode defaults
  process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL ??=
    "https://localhost:4444/secure-iframe.html";
  process.env.XENDIT_COMPONENTS_VERSION ??= `v${packageJson.version}`;
}

// environment variables to be replaced e.g. process.env.XENDIT_COMPONENTS_VERSION -> "v1.2.3"
const envs = {
  NODE_ENV: "production",
  XENDIT_COMPONENTS_SECURE_IFRAME_URL:
    process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL,
  XENDIT_COMPONENTS_VERSION: process.env.XENDIT_COMPONENTS_VERSION,
  ...checkoutUiGatewayHosts,
};

const year = new Date().getFullYear();
const bannerComment = `/*! Copyright (c) ${year} Xendit Inc. Licensed under the MIT License (MIT). */`;

function resolveModule(moduleName: string): string {
  return path.join(import.meta.dirname, "..", "node_modules", moduleName);
}

function rollupConfig(production: boolean): rollup.RollupOptions {
  return {
    input: path.join(import.meta.dirname, "./src/index.ts"),
    preserveEntrySignatures: "allow-extension",
    output: [
      {
        dir: path.join(import.meta.dirname, "dist", "esm"),
        format: "esm",
        sourcemap: true,
        inlineDynamicImports: false,
        banner: bannerComment,
        chunkFileNames: "[name].js",
      },
      {
        file: path.join(import.meta.dirname, "dist", "index.umd.js"),
        name: "Xendit",
        format: "umd",
        exports: "named",
        sourcemap: true,
        inlineDynamicImports: true,
        banner: bannerComment,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs({
        include: ["**/node_modules/**"],
      }),
      typescript({
        tsconfig: path.join(import.meta.dirname, "../tsconfig.json"),
        compilerOptions: {
          module: "esnext",
          noEmitOnError: false,
        },
      }),
      css(),
      json(),
      replace({
        preventAssignment: true,
        ...Object.fromEntries(
          Object.entries(envs).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value),
          ]),
        ),
      }),
      alias({
        entries: [
          // TODO: read from tsconfig.json
          { find: "react", replacement: resolveModule("preact/compat") },
          {
            find: "react-dom/test-utils",
            replacement: resolveModule("preact/test-utils"),
          },
          {
            find: "react-dom",
            replacement: resolveModule("preact/compat"),
          },
          {
            find: "react/jsx-runtime",
            replacement: resolveModule("preact/jsx-runtime"),
          },
        ],
      }),
      production
        ? terser({
            keep_classnames: true,
          })
        : null,
      codecovRollupPlugin({
        enableBundleAnalysis: !!process.env.CI,
        bundleName: "xendit-components-web",
        oidc: {
          useGitHubOIDC: true,
        },
      }),
    ].filter(Boolean),
    onwarn: (warning, warn) => {
      if (warning.code === "CIRCULAR_DEPENDENCY") {
        return;
      }
    },
  };
}

async function rollupProductionBuild() {
  const options = rollupConfig(true);
  const build = await rollup.rollup(options);
  for (const o of options.output as rollup.OutputOptions[]) {
    await build.write(o);
  }
}

async function rollupWatch() {
  const options = rollupConfig(false);
  const watcher = rollup.watch(options);

  watcher.on("event", async (event) => {
    switch (event.code) {
      case "BUNDLE_END": {
        if (event.result) {
          for (const o of options.output as rollup.OutputOptions[]) {
            if (o.format === "esm") {
              lastSeenBuildOutput = new Map(
                (await event.result.generate(o)).output.map((chunkOrAsset) => [
                  chunkOrAsset.fileName,
                  Buffer.from(
                    chunkOrAsset.type === "chunk"
                      ? chunkOrAsset.code
                      : chunkOrAsset.source,
                  ),
                ]),
              );
            }
            await event.result.write(o);
          }
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
  const code = await readFile(
    path.join(import.meta.dirname, "test-ui.cts"),
    "utf-8",
  );
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <title>Xendit SDK Test Page</title>
  </head>
  <body>
    <script src="https://pay.google.com/gp/p/js/pay.js"></script>
    <script src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"></script>
    <script type="module">${stripTypeScriptTypes(code)}</script>
  </body>
</html>`;
}

async function handleDevServerRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const pathname = new URL(`http://example.com${req.url}`).pathname;

  async function serveFileFromBundle(filename: string, mime: string) {
    if (!lastSeenBuildOutput) {
      res
        .writeHead(503, { "Content-Type": "text/plain" })
        .end("Build not ready");
      return;
    }
    const file = lastSeenBuildOutput.get(filename);
    res.writeHead(200, { "Content-Type": mime }).end(file);
  }

  const staticFilePath = path.join(import.meta.dirname, "dist", pathname);
  if (pathname.startsWith("/assets/") && existsSync(staticFilePath)) {
    const mimeType = mime.lookup(staticFilePath) || "application/octet-stream";
    res.writeHead(200, { "Content-Type": mimeType });
    createReadStream(staticFilePath).pipe(res);
    return;
  }

  if (pathname.startsWith("/esm/")) {
    const filename = pathname.slice("/esm/".length);
    return await serveFileFromBundle(filename, "application/javascript");
  }

  switch (`${req.method} ${pathname}`) {
    case "GET /": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(await generateTestPage());
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
  const server = createServer(
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

  server.listen(SDK_PORT, () => {
    console.log(`Server for sdk running at https://localhost:${SDK_PORT}/`);
    console.log(
      `SDK pointing to secure iframe URL: ${process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL}`,
    );
    console.log(`SDK version: ${process.env.XENDIT_COMPONENTS_VERSION}`);
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
