import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": root } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // Scoped deliberately: radio_component owns its own suite and runs it
    // with its own config. We never double-run it.
    include: ["{app,components,content,hooks,lib}/**/*.test.{ts,tsx}"],
  },
});
