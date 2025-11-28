#!/usr/bin/env -S node --experimental-transform-types

import * as fs from "fs/promises";
import * as path from "path";
import { mkdirSync } from "fs";
import * as rollup from "rollup";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

async function generateIframeHtml(js: string) {
  // generate html
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8"/>
    <title>Xendit</title>
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
  const html = await completeRollupBuild(build);

  mkdirSync(path.join(import.meta.dirname, "dist"), { recursive: true });
  await fs.writeFile(
    path.join(import.meta.dirname, "dist/action-landing-iframe.html"),
    html,
  );
}

switch (process.argv[2]) {
  case "dev": {
    // not implemented
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
