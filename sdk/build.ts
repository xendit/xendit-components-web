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

const SDK_PORT = 4443;

let lastSeenBuildOutput: Map<string, Buffer> | null = null;

function resolveModule(moduleName: string): string {
  return path.join(import.meta.dirname, "..", "node_modules", moduleName);
}

function rollupConfig(production: boolean): rollup.RollupOptions {
  return {
    input: path.join(import.meta.dirname, "./src/index.ts"),
    output: [
      {
        file: path.join(import.meta.dirname, "dist", "index.esm.js"),
        name: "XenditSdk",
        format: "esm",
        exports: "named",
        sourcemap: true,
        inlineDynamicImports: true,
      },
      {
        file: path.join(import.meta.dirname, "dist", "index.umd.js"),
        name: "XenditSdk",
        format: "umd",
        exports: "named",
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs({
        include: ["**/node_modules/**"],
      }),
      css(),
      typescript({
        tsconfig: path.join(import.meta.dirname, "../tsconfig.json"),
        compilerOptions: {
          module: "esnext",
          noEmitOnError: false,
        },
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
      // this seems to break watch mode, so disable it for now
      // sourcemaps({
      //   exclude: ["**/*.css", "**/*.ts"]
      // }),
      production ? terser() : null,
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
    <meta charset="UTF-8">
    <title>Xendit SDK Test Page</title>
  </head>
  <body>
    <script type="application/javascript" src="./index.umd.js" charset="UTF-8"></script>
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

  switch (`${req.method} ${pathname}`) {
    case "GET /": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(await generateTestPage());
      return;
    }
    case "GET /index.umd.js": {
      return await serveFileFromBundle(
        "index.umd.js",
        "application/javascript",
      );
    }
    case "GET /index.umd.js.map": {
      return await serveFileFromBundle("index.umd.js.map", "application/json");
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
