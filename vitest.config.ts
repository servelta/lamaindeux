import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./tests/setup/load-env.ts"],
    testTimeout: 15000, // integration tests hit a real (local) Supabase instance
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
