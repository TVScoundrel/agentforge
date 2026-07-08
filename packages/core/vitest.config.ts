import { defineConfig, mergeConfig } from 'vitest/config';
import rootConfig from '../../vitest.config.js';

export default mergeConfig(
  rootConfig,
  defineConfig({
    test: {
      name: 'core',
      include: [
        'tests/**/*.test.ts',
        'src/**/__tests__/**/*.test.ts',
      ],
    },
  })
);
