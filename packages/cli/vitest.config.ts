import { defineConfig, mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config.js';

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      name: 'cli',
      include: ['tests/**/*.test.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/templates/**',
      ],
    },
  })
);
