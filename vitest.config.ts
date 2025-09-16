import { defineConfig } from "vitest/config";

export default defineConfig({
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
  },
});
