import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Praise's workspace package — it owns its own lint and test config.
    "radio_component/**",
    // Generated output.
    "playwright-report/**",
    "test-results/**",
    "public/assets/**",
  ]),
]);

export default eslintConfig;
