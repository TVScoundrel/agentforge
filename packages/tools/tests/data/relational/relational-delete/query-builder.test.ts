/**
 * Query Builder Tests for Relational DELETE
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import { buildDeleteQuery } from '../../../../src/data/relational/query/query-builder.js';
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

describe('Relational DELETE - Query Builder', () => {
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
        deleted_at TEXT
      );
    `));

    await manager.execute(sql.raw(`
      INSERT INTO users (name, email)
      VALUES
        ('Alice', 'alice@example.com'),
        ('Bob', 'bob@example.com');
    `));
  });

  afterAll(async () => {
    if (!hasSQLiteBindings) {
      return;
    }

    await manager.disconnect();
  });

  it.skipIf(!hasSQLiteBindings)('should build and execute DELETE with WHERE', async () => {
    const built = buildDeleteQuery({
      table: 'users',
      where: [{ column: 'email', operator: 'eq', value: 'alice@example.com' }],
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT email FROM users ORDER BY id
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: 'bob@example.com' });
  });

  it('should reject DELETE without WHERE by default', () => {
    expect(() =>
      buildDeleteQuery({
        table: 'users',
        vendor: 'sqlite',
      })
    ).toThrow(/WHERE conditions are required for DELETE queries/i);
  });

  it.skipIf(!hasSQLiteBindings)('should allow full-table delete when explicitly enabled', async () => {
    await manager.execute(sql.raw(`
      INSERT INTO users (name, email)
      VALUES ('Carol', 'carol@example.com')
    `));

    const built = buildDeleteQuery({
      table: 'users',
      allowFullTableDelete: true,
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`SELECT id FROM users`)));
    expect(rows).toHaveLength(0);
  });

  it.skipIf(!hasSQLiteBindings)('should support soft delete mode', async () => {
    await manager.execute(sql.raw(`
      INSERT INTO users (name, email)
      VALUES ('Dave', 'dave@example.com')
    `));

    const built = buildDeleteQuery({
      table: 'users',
      where: [{ column: 'email', operator: 'eq', value: 'dave@example.com' }],
      softDelete: { column: 'deleted_at', value: '2026-02-19T00:00:00.000Z' },
      vendor: 'sqlite',
    });

    await manager.execute(built.query);

    const rows = extractRows(await manager.execute(sql.raw(`
      SELECT email, deleted_at
      FROM users
      WHERE email = 'dave@example.com'
    `)));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      email: 'dave@example.com',
      deleted_at: '2026-02-19T00:00:00.000Z',
    });
  });
});
