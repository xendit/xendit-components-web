import { defineConfig } from "vitest/config";

// https://vitest.dev/config/
export default defineConfig({
  test: {
    globals: true,
    // https://vitest.dev/config/#environmentmatchglobs
    environmentMatchGlobs: [
      // all tests with *.tsx will run in jsdom environment
      // by default environment test is `node`
      ["src/**/*.test.tsx", "jsdom"],
      ["tests-feature-level/**/*", "jsdom"]
    ],
    setupFiles: "setup-vitest.ts",
    deps: {
      inline: ["vitest-canvas-mock"]
    },
    // disabled because we don't need css to test
    // since parsing CSS is slow
    css: false,
    testTimeout: 10000
  }
});
