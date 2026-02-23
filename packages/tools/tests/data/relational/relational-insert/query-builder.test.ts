/**
 * Query Builder Tests for Relational INSERT
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { buildInsertQuery } from '../../../../src/data/relational/query/query-builder.js';
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

describe('Relational INSERT - Query Builder', () => {
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
      CREATE TABLE test_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'active'
      );
    `));

    await manager.execute(sql.raw(`
      CREATE TABLE test_defaults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status TEXT DEFAULT 'active',
        score INTEGER DEFAULT 0
      );
    `));
  });

  afterAll(async () => {
    if (!hasSQLiteBindings) {
      return;
    }

    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('should build and execute single-row INSERT query', async () => {
    const built = buildInsertQuery({
      table: 'test_users',
      data: { name: 'Alice', email: 'alice@example.com' },
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT name, email, status
      FROM test_users
      WHERE email = 'alice@example.com'
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'Alice',
      email: 'alice@example.com',
      status: 'active',
    });
  });

  it.skipIf(!hasSQLiteBindings)('should build and execute batch INSERT query with DEFAULT values for missing columns', async () => {
    const built = buildInsertQuery({
      table: 'test_users',
      data: [
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Carol', email: 'carol@example.com', status: 'inactive' },
      ],
      vendor: 'sqlite',
    });

    // Heterogeneous columns on SQLite returns SQL[] (one per row)
    if (Array.isArray(built.query)) {
      for (const q of built.query) {
        await manager.execute(q);
      }
    } else {
      await manager.execute(built.query);
    }

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT email, status
      FROM test_users
      WHERE email IN ('bob@example.com', 'carol@example.com')
      ORDER BY email ASC
    `)));

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ email: 'bob@example.com', status: 'active' });
    expect(rows[1]).toMatchObject({ email: 'carol@example.com', status: 'inactive' });
  });

  it.skipIf(!hasSQLiteBindings)('should support RETURNING id mode for vendors with RETURNING support', async () => {
    const built = buildInsertQuery({
      table: 'test_users',
      data: { name: 'Dave', email: 'dave@example.com' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'sqlite',
    });

    const rows = extractRows(await manager.execute(built.query));

    expect(rows).toHaveLength(1);
    expect(typeof rows[0].id).toBe('number');
  });

  it.skipIf(!hasSQLiteBindings)('should support RETURNING full rows mode for vendors with RETURNING support', async () => {
    const built = buildInsertQuery({
      table: 'test_users',
      data: { name: 'Eve', email: 'eve@example.com' },
      returning: { mode: 'row' },
      vendor: 'sqlite',
    });

    const rows = extractRows(await manager.execute(built.query));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'Eve',
      email: 'eve@example.com',
      status: 'active',
    });
  });

  it.skipIf(!hasSQLiteBindings)('should support DEFAULT VALUES for single-row insert', async () => {
    const built = buildInsertQuery({
      table: 'test_defaults',
      data: {},
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT status, score
      FROM test_defaults
      ORDER BY id DESC
      LIMIT 1
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      status: 'active',
      score: 0,
    });
  });

  it('should reject RETURNING full rows for mysql vendor', () => {
    expect(() =>
      buildInsertQuery({
        table: 'users',
        data: { name: 'Alice' },
        returning: { mode: 'row' },
        vendor: 'mysql',
      })
    ).toThrow(/not supported for mysql/i);
  });
});
