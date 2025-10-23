import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsEslintParser from "@typescript-eslint/parser";

export default defineConfig(
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsEslintParser,
      sourceType: 'module',
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    extends: ['@typescript-eslint/recommended'],
    rules: {
      "@typescript-eslint/no-unused-vars": [
            "warn",
            {
                vars: "all",
                varsIgnorePattern: "^_",
                args: "after-used",
                argsIgnorePattern: "^_",
            },
        ],
    }
  },
  {
    files: ['src/**/*.js'],
    plugins: {
      js,
    },
    extends: ['js/recommended']
  }
  // eslint.configs.recommended,
);