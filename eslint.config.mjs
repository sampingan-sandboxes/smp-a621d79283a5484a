// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'dist/', 'coverage/', '.esbuild/', '.serverless/', '.build/', 'jest.config.js'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // `const { _id, ...rest } = doc` is the standard way repos strip Mongo's _id —
      // the rest-sibling exclusion must not count as an unused variable.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      // Match the codebase convention of `import type { X }` for type-only imports.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
    },
  },
  {
    // Tests legitimately reach for looser typing when stubbing SDK shapes.
    files: ['**/*.test.ts', '**/*.steps.ts', 'jest.setup.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
