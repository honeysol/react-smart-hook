module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  settings: {},
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  rules: {
    "no-use-before-define": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
  overrides: [
    {
      files: ["*.js"],
      globals: {
        module: "readonly",
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
