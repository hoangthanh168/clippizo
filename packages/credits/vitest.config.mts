import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: [path.resolve(__dirname, "./__tests__/setup.ts")],
    globals: true,
  },
});
