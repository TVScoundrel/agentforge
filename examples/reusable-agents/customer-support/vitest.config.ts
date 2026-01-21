import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@agentforge/core': path.resolve(__dirname, '../../../packages/core/src'),
      '@agentforge/patterns': path.resolve(__dirname, '../../../packages/patterns/src'),
      '@agentforge/tools': path.resolve(__dirname, '../../../packages/tools/src'),
    },
  },
});

