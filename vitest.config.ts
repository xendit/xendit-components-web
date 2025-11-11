import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  test: {
    globals: true,
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
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
  },
});
