#!/usr/bin/env node --experimental-transform-types

import * as https from "https";
import * as http from "http";
import * as fs from "fs/promises";
import * as path from "path";
import { mkdirSync, readFileSync } from "fs";
import * as rollup from "rollup";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { stripTypeScriptTypes } from "module";

let lastSeenBuildOutput: string | null = null;

async function generateIframeHtml(js: string) {
  // copy pinning keys into the js
  const testPinningKeys = JSON.parse(
    await fs.readFile(
      path.join(import.meta.dirname, "../test-pinning-keys.json"),
      "utf-8"
    )
  ).map((key: JsonWebKey) => {
    // convert private keys to public keys
    return {
      kty: key.kty,
      crv: key.crv,
      x: key.x,
      y: key.y
    };
  });

  js = js.replace(`"### PINNING_KEYS ###"`, JSON.stringify(testPinningKeys));

  // generate html
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Xendit Secure Iframe</title>
  </head>
  <body>
    <script type="application/javascript">${js}</script>
  </body>
</html>
`;
}

function rollupConfig(production: boolean): rollup.RollupOptions {
  return {
    input: path.join(import.meta.dirname, "src/index.ts"),
    output: {
      file: "dist/not-a-real-file.js",
      format: "cjs"
    },
    watch: {
      skipWrite: true
    },
    plugins: [
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

async function completeRollupBuild(build: rollup.RollupBuild) {
  const bundleSource = await build.generate({});
  if (bundleSource.output.length !== 1) {
    throw new Error(
      `Expected single output from rollup, got ${bundleSource.output.length}`
    );
  }
  const code = bundleSource.output[0].code;
  return await generateIframeHtml(code);
}

async function rollupProductionBuild() {
  const options = rollupConfig(true);
  const build = await rollup.rollup(options);
  const html = await completeRollupBuild(build);

  mkdirSync(path.join(import.meta.dirname, "dist"), { recursive: true });
  await fs.writeFile(path.join(import.meta.dirname, "dist/iframe.html"), html);
}

async function rollupWatch() {
  const options = rollupConfig(false);
  const watcher = rollup.watch(options);

  watcher.on("event", async (event) => {
    switch (event.code) {
      case "BUNDLE_END": {
        if (event.result) {
          const html = await completeRollupBuild(event.result);
          lastSeenBuildOutput = html;
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
    "utf-8"
  );
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Xendit Secure Iframe Test Page</title>
  </head>
  <body>
    <script type="application/javascript">${stripTypeScriptTypes(code)}</script>
  </body>
</html>`;
}

async function handleDevServerRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const pathname = new URL(`http://example.com${req.url}`).pathname;

  async function serveFile(filename: string, mime: string) {
    const file = await fs.readFile(path.join(import.meta.dirname, filename));
    res.writeHead(200, { "Content-Type": mime });
    res.end(file);
  }

  switch (`${req.method} ${pathname}`) {
    case "GET /": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(await generateTestPage());
      return;
    }
    case "GET /iframe.html": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(lastSeenBuildOutput ?? "Build not finished");
      return;
    }
    case "GET /pinning-keys.json": {
      return await serveFile("../test-pinning-keys.json", "application/json");
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
  const PORT = 443;

  const keyDir = path.join(import.meta.dirname, "..");
  const server = https.createServer(
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
    console.log(`Server running at http://localhost:${PORT}/`);
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
