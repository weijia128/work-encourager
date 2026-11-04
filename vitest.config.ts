import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/services/**"],
      exclude: [
        "src/services/http.ts",
        "src/services/platform.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/__fixtures__/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
