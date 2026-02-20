/**
 * Shared test helpers for integration tests.
 *
 * Provides setup/teardown functions that create tables and seed data
 * through the ConnectionManager, ensuring all tests start from a known state.
 *
 * @module integration/setup/test-helpers
 */

import { ConnectionManager } from '../../../../../src/data/relational/connection/connection-manager.js';
import { executeQuery } from '../../../../../src/data/relational/query/query-executor.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import type { DatabaseVendor } from '../../../../../src/data/relational/types.js';
import {
  getCreateTableStatements,
  getDropTableStatements,
  getSeedStatements,
} from './fixtures.js';

/**
 * Create a ConnectionManager for a given vendor and connection string.
 */
export function createTestConnectionManager(
  vendor: DatabaseVendor,
  connectionString: string,
): ConnectionManager {
  const config: ConnectionConfig = {
    vendor,
    connection: connectionString,
  } as ConnectionConfig;
  return new ConnectionManager(config);
}

/**
 * Set up the test schema: drop any existing tables, create tables, seed data.
 * Operates through executeQuery to exercise the real code path.
 */
export async function setupTestSchema(
  manager: ConnectionManager,
  vendor: DatabaseVendor,
): Promise<void> {
  // Drop existing tables first (reverse FK order)
  const drops = getDropTableStatements();
  for (const ddl of drops) {
    await executeQuery(manager, { sql: ddl, vendor });
  }

  // Create tables
  const creates = getCreateTableStatements(vendor);
  for (const ddl of creates) {
    await executeQuery(manager, { sql: ddl, vendor });
  }

  // Seed data
  const seeds = getSeedStatements(vendor);
  for (const seed of seeds) {
    await executeQuery(manager, { sql: seed.sql, params: seed.params, vendor });
  }
}

/**
 * Tear down the test schema.
 */
export async function teardownTestSchema(
  manager: ConnectionManager,
  _vendor: DatabaseVendor,
): Promise<void> {
  const drops = getDropTableStatements();
  for (const ddl of drops) {
    try {
      await executeQuery(manager, { sql: ddl, vendor: _vendor });
    } catch {
      // Ignore drop errors during teardown
    }
  }
}

/**
 * Measure execution time for an async operation.
 * Returns { result, durationMs }.
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;
  return { result, durationMs };
}
