#!/usr/bin/env node --experimental-transform-types

import { execSync } from "node:child_process";

// run builds for both sub-projects
await import("./sdk/build.ts");
await import("./secure-iframe/build.ts");

// if prod, build .d.ts file for sdk
if (process.argv[2] === "prod") {
  const cmds = [
    `pnpm tsc --noEmit false --outDir "./temp-dts" --declaration --emitDeclarationOnly --stripInternal ./sdk/src/index.ts`,
    `pnpm api-extractor run --local --verbose`,
    `rm -rf "./temp-dts" "./temp"`
  ];
  for (const cmd of cmds) {
    execSync(cmd, { stdio: "inherit" });
  }
}
