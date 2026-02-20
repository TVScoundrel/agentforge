/**
 * Shared test helpers for integration tests.
 *
 * Provides setup/teardown functions that create tables and seed data
 * through the ConnectionManager, ensuring all tests start from a known state.
 *
 * DDL operations (CREATE, DROP) go directly through manager.execute()
 * because the query-executor's SQL sanitiser intentionally rejects them.
 * Seed INSERT/SELECT statements also use manager.execute() for simplicity.
 *
 * @module integration/setup/test-helpers
 */

import { sql } from 'drizzle-orm';
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
 * DDL operations bypass the query-executor to avoid its SQL sanitiser
 * (which intentionally rejects CREATE/DROP).
 */
export async function setupTestSchema(
  manager: ConnectionManager,
  vendor: DatabaseVendor,
): Promise<void> {
  // Drop existing tables first (reverse FK order)
  const drops = getDropTableStatements();
  for (const ddl of drops) {
    await manager.execute(sql.raw(ddl));
  }

  // Create tables
  const creates = getCreateTableStatements(vendor);
  for (const ddl of creates) {
    await manager.execute(sql.raw(ddl));
  }

  // Seed data — use executeQuery for proper parameter binding
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
      await manager.execute(sql.raw(ddl));
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
