import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test environment — 'node' for unit tests; 'browser' may be added later for DOM tests
    environment: "node",

    // Glob patterns for test files
    include: [
      "extension/tests/**/*.test.ts",
      "extension/tests/**/*.spec.ts",
    ],

    // Coverage configuration (Phase 11+)
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["extension/src/**/*.ts"],
      exclude: [
        "extension/src/types/**",
        "extension/src/**/*.d.ts",
      ],
    },

    // Aliases matching tsconfig paths
    alias: {
      "@extension": new URL("./extension/src", import.meta.url).pathname,
      "@types": new URL("./extension/src/types", import.meta.url).pathname,
    },
  },
});
