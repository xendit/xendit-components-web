#!/usr/bin/env node --experimental-transform-types

import typescript from "@rollup/plugin-typescript";
import path from "path";
import * as rollup from "rollup";
import terser from "@rollup/plugin-terser";

function rollupConfig(production: boolean): rollup.RollupOptions {
  return {
    input: path.join(import.meta.dirname, "./src/index.ts"),
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

async function rollupProductionBuild() {
  const options = rollupConfig(true);
  const build = await rollup.rollup(options);
  await build.write({
    file: path.join(import.meta.dirname, "dist/index.js"),
    format: "cjs"
  });
}

switch (process.argv[2]) {
  case "dev": {
    // Promise.all([rollupWatch(), startDevServer()]).catch((err) => {
    //   console.error("Error in dev mode:", err);
    //   process.exit(1);
    // });
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
