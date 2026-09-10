import { afterEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { ConnectionManager } from '../../../../src/data/relational/connection/connection-manager.js';
import {
  SchemaCache,
  SchemaInspector,
} from '../../../../src/data/relational/schema/schema-inspector.js';
import { invokeRelationalGetSchema } from '../../../../src/data/relational/tools/relational-get-schema.js';
import { invokeRelationalQuery } from '../../../../src/data/relational/tools/relational-query.js';
import { invokeRelationalSelect } from '../../../../src/data/relational/tools/relational-select/index.js';

describe('owned-session relational read execution', () => {
  afterEach(() => {
    SchemaInspector.clearCache();
  });

  it('reuses one SQLite session across query, select, and schema operations', async () => {
    const session = new ConnectionManager({ vendor: 'sqlite', connection: ':memory:' });
    await session.connect();

    try {
      await session.execute(sql.raw(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `));
      await session.execute(sql.raw("INSERT INTO users (id, name) VALUES (1, 'Alice'), (2, 'Bob')"));

      const execution = { executor: session, vendor: 'sqlite' } as const;
      const query = await invokeRelationalQuery(execution, {
        sql: 'SELECT COUNT(*) AS count FROM users',
      });
      const select = await invokeRelationalSelect(execution, {
        table: 'users',
        columns: ['id', 'name'],
        orderBy: [{ column: 'id', direction: 'asc' }],
      });
      const schema = await invokeRelationalGetSchema(execution, {
        tables: ['users'],
      });

      expect(query).toMatchObject({ success: true, rows: [{ count: 2 }], rowCount: 1 });
      expect(select).toMatchObject({
        success: true,
        rows: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        rowCount: 2,
      });
      expect(schema).toMatchObject({
        success: true,
        summary: { tableCount: 1, columnCount: 2 },
      });
    } finally {
      await session.disconnect();
    }
  });

  it('uses and invalidates schema cache state owned by the caller', async () => {
    const session = new ConnectionManager({ vendor: 'sqlite', connection: ':memory:' });
    const schemaCache = new SchemaCache();
    await session.connect();

    try {
      await session.execute(sql.raw('CREATE TABLE users (id INTEGER PRIMARY KEY)'));
      const execution = { executor: session, vendor: 'sqlite', schemaCache } as const;

      const initial = await invokeRelationalGetSchema(execution, {});
      await session.execute(sql.raw('CREATE TABLE posts (id INTEGER PRIMARY KEY)'));
      const cached = await invokeRelationalGetSchema(execution, {});
      const refreshed = await invokeRelationalGetSchema(execution, { refreshCache: true });

      expect(initial.success && initial.summary.tableCount).toBe(1);
      expect(cached.success && cached.summary.tableCount).toBe(1);
      expect(refreshed.success && refreshed.summary.tableCount).toBe(2);

      schemaCache.clear();
      await session.execute(sql.raw('CREATE TABLE comments (id INTEGER PRIMARY KEY)'));
      const afterOwnerClear = await invokeRelationalGetSchema(execution, {});
      expect(afterOwnerClear.success && afterOwnerClear.summary.tableCount).toBe(3);
    } finally {
      await session.disconnect();
    }
  });

  it('does not clear unrelated global cache state when refreshing without an owned cache', async () => {
    const session = new ConnectionManager({ vendor: 'sqlite', connection: ':memory:' });
    await session.connect();

    try {
      await session.execute(sql.raw('CREATE TABLE users (id INTEGER PRIMARY KEY)'));
      const legacyInspector = new SchemaInspector(session, 'sqlite', {
        cacheKey: 'unrelated-legacy-session',
      });
      const initialLegacySchema = await legacyInspector.inspect();

      await session.execute(sql.raw('CREATE TABLE posts (id INTEGER PRIMARY KEY)'));
      await invokeRelationalGetSchema(
        { executor: session, vendor: 'sqlite' },
        { refreshCache: true },
      );
      const cachedLegacySchema = await legacyInspector.inspect();

      expect(initialLegacySchema.tables).toHaveLength(1);
      expect(cachedLegacySchema.tables).toHaveLength(1);
    } finally {
      await session.disconnect();
    }
  });

  it('preserves safe validation and sanitized driver errors for owned sessions', async () => {
    const validation = await invokeRelationalQuery(
      { executor: { execute: async () => [] }, vendor: 'sqlite' },
      { sql: 'DROP TABLE users' },
    );
    const driverFailure = await invokeRelationalSelect(
      {
        executor: {
          execute: async () => {
            throw new Error('secret driver detail');
          },
        },
        vendor: 'sqlite',
      },
      { table: 'users' },
    );

    expect(validation).toMatchObject({ success: false });
    expect(validation.success || validation.error).toMatch(/dangerous SQL operation/);
    expect(driverFailure).toEqual({
      success: false,
      error: 'Failed to execute SELECT query. Please verify your input and database connection.',
      rows: [],
      rowCount: 0,
    });
  });
});
