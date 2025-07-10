import { defineConfig } from "vite";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.BASE_ASSETS_URL || "/",
  plugins: [],
  build: {
    sourcemap: true,
    minify: true,
    rollupOptions: {
      output: {
        sourcemapFileNames: "sourcemaps/[name]-[hash].js.map"
      }
    }
  }
});
