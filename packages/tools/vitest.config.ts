import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config.js';

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'tools',
      include: [
        'tests/**/*.test.ts',
        'src/**/__tests__/**/*.test.ts',
      ],
    },
  })
);
