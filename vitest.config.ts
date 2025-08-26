import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts?(x)'],
    exclude: ['tests/e2e/**', 'node_modules/**', '.next/**'],
    environment: 'node',
  },
});
