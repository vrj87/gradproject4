import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@photos/discovery-core": path.join(root, "packages/discovery-core/src/index.ts")
    }
  },
  test: {
    include: ["tests/discovery/unit/**/*.test.ts", "tests/mvp/unit/**/*.test.ts"],
    environment: "node"
  }
});
