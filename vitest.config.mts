import { fileURLToPath } from "url";
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // `.next` contains generated route types that are not tests, and node_modules is
    // excluded by default.
    exclude: ["node_modules/**", ".next/**"],
  },
  resolve: {
    // Mirrors the `@/*` alias in tsconfig.json and next.config.ts. Kept in step by hand —
    // three places is one too many, but Next and Vitest do not share a resolver.
    alias: {
      "@": path.dirname(fileURLToPath(import.meta.url)),
    },
  },
});
