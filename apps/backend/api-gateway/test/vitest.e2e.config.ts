import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    env: {
      AUTH_JWT_ACCESS_SECRET: 'test-secret',
      AUTH_SERVICE_URL: 'http://localhost:3001',
      PRODUCTS_SERVICE_URL: 'http://localhost:3002',
      FINANCE_SERVICE_URL: 'http://localhost:3003',
      LOGISTICS_SERVICE_URL: 'http://localhost:3004',
    },
  },
  plugins: [
    // This is required to build NestJS decorators correctly with Vitest
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
          dynamicImport: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
      },
    }),
  ],
});
