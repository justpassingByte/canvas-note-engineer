import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'frontend/src/**/__tests__/**/*.test.ts',
      'backend/src/**/__tests__/**/*.test.ts'
    ]
  },
  resolve: {
    alias: {
      '@frontend': path.resolve(import.meta.dirname, './frontend/src'),
      '@backend': path.resolve(import.meta.dirname, './backend/src')
    }
  }
});
