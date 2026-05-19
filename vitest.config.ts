import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// GB-0686: Coverage thresholds enforced to prevent drift.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**/*.{ts,tsx}", "src/hooks/**/*.{ts,tsx}"],
      exclude: [
        "src/lib/**/*.d.ts",
        "src/lib/README.md",
        "src/integrations/**",
      ],
      // Soft thresholds — ratchet up as more tests are added (GB-0699..0713).
      thresholds: {
        lines: 35,
        functions: 35,
        statements: 35,
        branches: 30,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
