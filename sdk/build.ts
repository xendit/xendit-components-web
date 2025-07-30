#!/usr/bin/env node --experimental-transform-types

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

const PORT = 4443;

const output: rollup.OutputOptions = {
  // file: path.join(import.meta.dirname, "dist/index.js"),
  name: "XenditSdk",
  format: "umd",
  exports: "named",
  dir: path.join(import.meta.dirname, "dist"),
  sourcemap: true
};

function rollupConfig(production: boolean): rollup.RollupOptions {
  return {
    input: path.join(import.meta.dirname, "./src/index.ts"),
    output,
    plugins: [
      resolve(),
      css(),
      typescript({
        tsconfig: path.join(import.meta.dirname, "../tsconfig.json"),
        compilerOptions: {
          module: "esnext"
        }
      }),
      production ? terser() : null
    ].filter(Boolean)
  };
}

async function rollupProductionBuild() {
  const options = rollupConfig(true);
  const build = await rollup.rollup(options);
  await build.write(output);
}

async function rollupWatch() {
  const options = rollupConfig(false);
  const watcher = rollup.watch(options);

  watcher.on("event", async (event) => {
    switch (event.code) {
      case "BUNDLE_END": {
        if (event.result) {
          await event.result.write(output);
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
    "utf-8"
  );
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Xendit SDK Test Page</title>
  </head>
  <body>
    <script type="application/javascript" src="./index.js"></script>
    <script type="module">${stripTypeScriptTypes(code)}</script>
  </body>
</html>`;
}

async function handleDevServerRequest(
  req: IncomingMessage,
  res: ServerResponse
) {
  const pathname = new URL(`http://example.com${req.url}`).pathname;

  async function serveFile(filename: string, mime: string) {
    const file = await readFile(path.join(import.meta.dirname, filename));
    res.writeHead(200, { "Content-Type": mime });
    res.end(file);
  }

  switch (`${req.method} ${pathname}`) {
    case "GET /": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(await generateTestPage());
      return;
    }
    case "GET /index.js": {
      return await serveFile("./dist/index.js", "application/javascript");
    }
    case "GET /favicon.ico": {
      res.writeHead(201, {});
      res.end();
      return;
    }
    default: {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
  }
}

async function startDevServer() {
  const keyDir = path.join(import.meta.dirname, "..");
  const server = createServer(
    {
      key: readFileSync(path.join(keyDir, "test-key.pem")),
      cert: readFileSync(path.join(keyDir, "test-cert.pem"))
    },
    (req, res) => {
      handleDevServerRequest(req, res).catch((err) => {
        console.error(err);
      });
    }
  );

  server.listen(PORT, () => {
    console.log(`Server for sdk running at https://localhost:${PORT}/`);
  });
}

switch (process.argv[2]) {
  case "dev": {
    Promise.all([rollupWatch(), startDevServer()]).catch((err) => {
      console.error("Error in dev mode:", err);
      process.exit(1);
    });
    break;
  }
  case "prod": {
    rollupProductionBuild().catch((err) => {
      console.error("Error in production build:", err);
      process.exit(1);
    });
    break;
  }
  default: {
    console.error(
      `Usage: ${process.argv[1]} dev|prod\n` +
        "  dev - start development server (rebuilds when you change any file)\n" +
        "  prod - build production version"
    );
    process.exit(1);
  }
}
