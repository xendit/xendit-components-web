#!/usr/bin/env -S node --experimental-transform-types

import typescript from "@rollup/plugin-typescript";
import path, { extname } from "path";
import * as rollup from "rollup";
import { createServer } from "https";
import { readFileSync } from "fs";
import { IncomingMessage, ServerResponse } from "http";
import { readFile, stat } from "fs/promises";
import resolve from "@rollup/plugin-node-resolve";
import { execSync } from "child_process";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

const DEMO_SERVER_PORT = 4442;

function rollupConfig(demoName: string): rollup.RollupOptions {
  const isTsx = demoName === "react";
  return {
    input: path.join(
      import.meta.dirname,
      "demos",
      demoName,
      isTsx ? "./index.tsx" : "./index.ts",
    ),
    output: {
      name: `Demo_${demoName}`,
      format: "umd",
      exports: "named",
      dir: path.join(import.meta.dirname, "demos", demoName, "dist"),
      sourcemap: true,
    },
    plugins: [
      resolve({
        browser: true,
      }),
      commonjs({
        include: ["**/node_modules/**"],
      }),
      typescript({
        tsconfig: path.join(import.meta.dirname, "tsconfig.demos.json"),
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development"),
      }),
    ],
    onwarn: (warning, warn) => {
      if (warning.code === "CIRCULAR_DEPENDENCY") {
        return;
      }
    },
  };
}

// const demoList = (await readdirSync(path.join(import.meta.dirname, "demos")))
//   .filter((name) => {
//     const stats = statSync(path.join(import.meta.dirname, "demos", name));
//     return stats && stats.isDirectory();
//   })
//   .filter((name) => {
//     return name !== "node_modules";
//   });
const demoList = ["react", "jquery"];

async function rollupWatch() {
  for (const demo of demoList) {
    const options = rollupConfig(demo);
    const watcher = rollup.watch(options);

    watcher.on("event", async (event) => {
      switch (event.code) {
        case "BUNDLE_END": {
          if (event.result) {
            await event.result.write(options.output as rollup.OutputOptions);
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
}

function extToMime(ext: string) {
  switch (ext) {
    case ".html":
      return "text/html";
    case ".js":
      return "application/javascript";
    case ".css":
      return "text/css";
    case ".map":
      return "application/json";
    default:
      return "text/plain";
  }
}

async function handleDevServerRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const pathname = new URL(`http://example.com${req.url}`).pathname;

  async function serveFile(filename: string, mime: string) {
    const file = await readFile(path.join(import.meta.dirname, filename));
    res.writeHead(200, { "Content-Type": mime });
    res.end(file);
  }

  const filePart = path.join("./demos", pathname.slice(1));
  try {
    const stats = await stat(filePart);
    if (stats.isFile()) {
      return await serveFile(filePart, extToMime(extname(filePart)));
    }
  } catch (e) {
    void e;
  }

  // Favicon
  if (req.method === "GET" && pathname.endsWith("/favicon.ico")) {
    res.writeHead(201, {}).end();
    return;
  }

  // Home page (list of links to demos)
  if (req.method === "GET" && pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    const list = demoList.map(
      (demo) => `<li><a href="/${demo}/index.html">${demo} demo</a></li>`,
    );
    res.end(
      `<html><body><h1>Xendit Components SDK Demo Apps</h1><ul>${list.join("")}</ul></body></html>`,
    );
    return;
  }

  // Secure iframe
  if (req.method === "GET" && pathname === "/secure-iframe/iframe.html") {
    await serveFile("secure-iframe/dist/iframe.html", "text/html");
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("404 Not Found");
  return;
}

async function startDevServer() {
  const keyDir = path.join(import.meta.dirname);
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

  server.listen(DEMO_SERVER_PORT, () => {
    console.log(
      `Server for sdk running at https://localhost:${DEMO_SERVER_PORT}/`,
    );
  });
}

execSync("cd ./demos && npm i", { stdio: "inherit" });
process.argv[2] = "prod"; // demos need a prod build first
await import("./build.ts");

await Promise.all([rollupWatch(), startDevServer()]).catch((err) => {
  console.error("Error in dev mode:", err);
  process.exit(1);
});
