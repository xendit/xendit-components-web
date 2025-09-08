import { defineConfig } from "vitest/config";

export default defineConfig({
  optimizeDeps: { include: ["card-validator"] },
  test: {
    globals: true,
    include: ["**/__tests__/**/*.{test,spec}.{ts,tsx,js,jsx}"],
    projects: [
      {
        extends: true,
        test: {
          environment: "jsdom",
        },
      },
    ],
    server: {
      deps: {
        inline: ["vitest-canvas-mock"],
      },
    },
    css: false,
    testTimeout: 10000,
  },
});
