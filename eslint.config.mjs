import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "admin/vendor/**", "**/*.min.js", "api/**"] },
  js.configs.recommended,
  {
    files: ["js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: { ...globals.browser },
    },
    rules: {
      "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }],
      "no-var": "off",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-implicit-globals": "error",
    },
  },
  {
    files: ["tests/**/*.cjs", "scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.node } },
  },
  // Playwright evaluates parts of these files inside the page, so browser globals are valid there too.
  { files: ["tests/**/*.cjs"], languageOptions: { sourceType: "commonjs", globals: { ...globals.node, ...globals.browser } } },
];
