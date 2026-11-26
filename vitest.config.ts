import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/agents/**/*.ts"],
      exclude: ["src/lib/db.ts", "src/agents/types.ts"],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90
      }
    }
  }
});
