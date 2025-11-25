const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/coverage/',
      '**/.pnpm-store/',
      // generated clients, prisma artifacts and wasm/runtime files
      'apps/**/src/generated/**',
      '**/generated/**',
      '**/client_fix/**',
      '**/src/**/client_fix/**',
      '**/*.wasm',
      '**/query_engine_*.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off', // TypeScript handles this
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
