import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      '**/__tests__/**/*.{test,spec}.{js,ts}',
      '**/*.{test,spec}.{js,ts}',
    ],
    exclude: ['node_modules', 'dist'],
  },
});
