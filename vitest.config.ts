import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import path from "path";
import { readFileSync } from "fs";

const packageJson = JSON.parse(
  readFileSync(path.join(import.meta.dirname, "./package.json"), "utf-8"),
) as typeof import("./package.json");

const pinningKeys: JsonWebKey[] = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "./test-pinning-keys.json"),
    "utf-8",
  ),
);

const PINNING_KEYS_MACRO = pinningKeys.map((key) => ({
  ...key,
  d: undefined,
}));
const PRIVATE_PINNING_KEY_MACRO = pinningKeys[0];

export default defineConfig({
  plugins: [preact()],
  define: {
    "process.env.XENDIT_COMPONENTS_SECURE_IFRAME_URL": JSON.stringify(
      "https://xendit-secure-iframe/iframe.html",
    ),
    "process.env.XENDIT_COMPONENTS_VERSION": JSON.stringify(
      `v${packageJson.version}`,
    ),
    PINNING_KEYS_MACRO,
    PRIVATE_PINNING_KEY_MACRO,
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
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: process.env.CI ? "test-report.junit.xml" : undefined,
    coverage: {
      enabled: true,
      reporter: process.env.CI ? ["lcov"] : ["html"],
      include: ["sdk/src/**/*.{ts,tsx}", "secure-iframe/src/**/*.{ts,tsx}"],
    },
    pool: "threads",
  },
});
