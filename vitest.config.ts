import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import path from "path";
import { readFileSync } from "fs";

const packageJson = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "./package.json"), "utf-8"),
) as typeof import("./package.json");

export default defineConfig({
  plugins: [preact()],
  define: {
    "process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL": JSON.stringify(
      "https://xendit-secure-iframe/iframe.html",
    ),
    "process.env.XENDIT_COMPONENTS_VERSION": JSON.stringify(
      `v${packageJson.version}`,
    ),
  },
  test: {
    globals: true,
    setupFiles: "./setup-vitest.ts",
    include: ["**/*.test.{ts,tsx}"],
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
        },
      },
    ],
    css: false,
    testTimeout: 10000,
    coverage: {
      enabled: true,
      reporter: ["html"],
      include: ["sdk/src/**/*.{ts,tsx}", "secure-iframe/src/**/*.{ts,tsx}"],
    },
    pool: "threads",
  },
});
