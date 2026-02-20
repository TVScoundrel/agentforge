/**
 * Vitest configuration for integration tests.
 *
 * Integration tests require Docker (testcontainers) for PostgreSQL and MySQL,
 * and compiled better-sqlite3 native bindings for SQLite.
 *
 * Run with: pnpm test:integration
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/tools/tests/data/relational/integration/**/*.integration.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    // Integration tests can be slow (container startup), so generous timeouts
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Run tests sequentially within each file to avoid port/container conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/tools/src/data/relational/**/*.ts'],
      exclude: ['**/*.test.ts', '**/types.ts', '**/index.ts'],
    },
  },
});
