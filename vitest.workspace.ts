import { defineWorkspace } from 'vitest/config';

/**
 * Vitest Workspace Configuration
 * 
 * Consolidates test configuration across all packages in the monorepo.
 * Each package extends the base configuration with package-specific overrides.
 */
export default defineWorkspace([
  // Core package - uses root config
  // Tests are in both tests/ and src/**/__tests__/
  {
    extends: './vitest.config.ts',
    test: {
      name: 'core',
      include: [
        'packages/core/tests/**/*.test.ts',
        'packages/core/src/**/__tests__/**/*.test.ts',
      ],
    },
  },

  // Patterns package
  {
    extends: './vitest.config.ts',
    test: {
      name: 'patterns',
      include: ['packages/patterns/tests/**/*.test.ts'],
    },
  },

  // Tools package
  // Tests are in both tests/ and src/**/__tests__/
  {
    extends: './vitest.config.ts',
    test: {
      name: 'tools',
      include: [
        'packages/tools/tests/**/*.test.ts',
        'packages/tools/src/**/__tests__/**/*.test.ts',
      ],
    },
  },

  // Testing package
  {
    extends: './vitest.config.ts',
    test: {
      name: 'testing',
      include: ['packages/testing/tests/**/*.test.ts'],
    },
  },

  // CLI package - has special excludes for templates
  {
    extends: './vitest.config.ts',
    test: {
      name: 'cli',
      include: ['packages/cli/tests/**/*.test.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/templates/**', // CLI templates are for generated projects
      ],
    },
  },
]);

