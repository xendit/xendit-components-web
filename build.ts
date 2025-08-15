#!/usr/bin/env node --experimental-transform-types

import { execSync } from "node:child_process";

// remove all artifacts
execSync(`rm -rf "./temp-dts" "./temp" "./sdk/dist" "./secure-iframe/dist"`, {
  stdio: "inherit",
});

// run builds for both sub-projects
await Promise.all([
  await import("./sdk/build.ts"),
  await import("./secure-iframe/build.ts"),
]);

// if prod, build .d.ts file for sdk
if (process.argv[2] === "prod") {
  const cmds = [
    `pnpm tsc --project ./tsconfig.build.json`,
    `pnpm api-extractor run --local --verbose`,
    `rm -rf "./temp-dts" "./temp"`,
  ];
  for (const cmd of cmds) {
    execSync(cmd, { stdio: "inherit" });
  }
}
