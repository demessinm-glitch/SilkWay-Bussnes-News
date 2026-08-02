const js = require("@eslint/js");

module.exports = [
  { ignores: ["node_modules/**", "dist/**"] },
  js.configs.recommended,
  {
    files: ["eslint.config.js"],
    languageOptions: { globals: { require: "readonly", module: "readonly" } },
  },
  {
    files: ["scripts/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        __dirname: "readonly",
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  {
    files: ["scripts/sync-astana.js"],
    languageOptions: {
      globals: { document: "readonly", location: "readonly" },
    },
  },
  {
    files: ["assets/js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "script",
      globals: {
        document: "readonly",
        location: "readonly",
        history: "readonly",
        fetch: "readonly",
        URLSearchParams: "readonly",
        Intl: "readonly",
        Date: "readonly",
        Promise: "readonly",
        Map: "readonly",
        Set: "readonly",
        scrollTo: "readonly",
        encodeURIComponent: "readonly",
        console: "readonly",
        HTMLAnchorElement: "readonly",
        module: "readonly",
        window: "readonly",
      },
    },
  },
];
