/**
 * Query Builder Tests for Relational UPDATE
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { buildUpdateQuery } from '../../../../src/data/relational/query/query-builder.js';
import type { ConnectionConfig } from '../../../../src/data/relational/connection/types.js';
import { hasSQLiteBindings } from './test-utils.js';

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    return result as Array<Record<string, unknown>>;
  }

  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown[] }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows;
  }

  return [];
}

describe('Relational UPDATE - Query Builder', () => {
  let manager: ConnectionManager;

  beforeAll(async () => {
    if (!hasSQLiteBindings) {
      return;
    }

    const config: ConnectionConfig = {
      vendor: 'sqlite',
      connection: ':memory:',
    };

    manager = new ConnectionManager(config);
    await manager.connect();

    await manager.execute(sql.raw(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'active',
        version INTEGER DEFAULT 1
      );
    `));

    await manager.execute(sql.raw(`
      INSERT INTO users (name, email, status, version)
      VALUES
        ('Alice', 'alice@example.com', 'active', 1),
        ('Bob', 'bob@example.com', 'active', 1);
    `));
  });

  afterAll(async () => {
    if (!hasSQLiteBindings) {
      return;
    }

    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('should build and execute UPDATE with WHERE', async () => {
    const built = buildUpdateQuery({
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT status
      FROM users
      WHERE email = 'alice@example.com'
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'inactive' });
  });

  it('should reject UPDATE without WHERE by default', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: { status: 'inactive' },
        vendor: 'sqlite',
      })
    ).toThrow(/WHERE conditions are required for UPDATE queries/i);
  });

  it.skipIf(!hasSQLiteBindings)('should allow full-table update when explicitly enabled', async () => {
    const built = buildUpdateQuery({
      table: 'users',
      data: { status: 'archived' },
      allowFullTableUpdate: true,
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT DISTINCT status
      FROM users
      ORDER BY status
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: 'archived' });
  });

  it.skipIf(!hasSQLiteBindings)('should include optimistic lock condition', async () => {
    await manager.execute(sql.raw(`
      UPDATE users
      SET status = 'active', version = 1
      WHERE email = 'bob@example.com'
    `));

    const built = buildUpdateQuery({
      table: 'users',
      data: { status: 'inactive', version: 2 },
      where: [{ column: 'email', operator: 'eq', value: 'bob@example.com' }],
      optimisticLock: { column: 'version', expectedValue: 1 },
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT status, version
      FROM users
      WHERE email = 'bob@example.com'
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: 'inactive',
      version: 2,
    });
  });

  it('should reject empty update data', () => {
    expect(() =>
      buildUpdateQuery({
        table: 'users',
        data: {},
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'sqlite',
      })
    ).toThrow(/Update data must not be empty/i);
  });
});
