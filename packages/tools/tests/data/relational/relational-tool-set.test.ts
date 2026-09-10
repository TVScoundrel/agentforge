import Database from 'better-sqlite3';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  ConnectionManager,
  createRelationalToolSet,
  RelationalToolSetConfigurationError,
  RelationalToolSetDisposedError,
  SchemaCache,
} from '../../../src/data/relational/index.js';

const temporaryDirectories: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDatabase(): string {
  const directory = mkdtempSync(join(tmpdir(), 'agentforge-tool-set-'));
  temporaryDirectories.push(directory);
  return join(directory, 'database.sqlite');
}

function seedUsers(databasePath: string): void {
  const database = new Database(databasePath);
  database.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    INSERT INTO users (id, name) VALUES (1, 'Alice');
  `);
  database.close();
}

function schemaFields(schema: z.ZodTypeAny): string[] {
  const objectSchema = schema instanceof z.ZodEffects ? schema.innerType() : schema;
  return Object.keys((objectSchema as z.AnyZodObject).shape);
}

describe('Relational Tool Set', () => {
  it('exposes six named and iterable credential-free Tools without connecting', () => {
    const toolSet = createRelationalToolSet(
      { vendor: 'sqlite', connection: ':memory:' },
      { prefix: 'warehouse' }
    );

    expect([...toolSet]).toEqual([
      toolSet.query,
      toolSet.select,
      toolSet.insert,
      toolSet.update,
      toolSet.delete,
      toolSet.getSchema,
    ]);
    expect([...toolSet].map((tool) => tool.metadata.name)).toEqual([
      'warehouse-relational-query',
      'warehouse-relational-select',
      'warehouse-relational-insert',
      'warehouse-relational-update',
      'warehouse-relational-delete',
      'warehouse-relational-get-schema',
    ]);

    for (const tool of toolSet) {
      const fields = schemaFields(tool.schema);
      expect(fields).not.toContain('vendor');
      expect(fields).not.toContain('connectionString');
    }
  });

  it('validates configuration synchronously and preserves default Tool names', () => {
    const connect = vi.spyOn(ConnectionManager.prototype, 'connect');
    const toolSet = createRelationalToolSet({ vendor: 'sqlite', connection: ':memory:' });

    expect(connect).not.toHaveBeenCalled();
    expect([...toolSet].map((tool) => tool.metadata.name)).toEqual([
      'relational-query',
      'relational-select',
      'relational-insert',
      'relational-update',
      'relational-delete',
      'relational-get-schema',
    ]);
    expect(() =>
      createRelationalToolSet({ vendor: 'sqlite', connection: ':memory:' }, { prefix: 'Not Valid' })
    ).toThrow(RelationalToolSetConfigurationError);
    expect(() =>
      createRelationalToolSet(
        { vendor: 'sqlite', connection: ':memory:' },
        { schemaCacheTtlMs: -1 }
      )
    ).toThrow(RelationalToolSetConfigurationError);
  });

  it('accepts every supported adapter configuration without performing I/O', () => {
    const connect = vi.spyOn(ConnectionManager.prototype, 'connect');

    expect(() =>
      createRelationalToolSet({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/agentforge',
      })
    ).not.toThrow();
    expect(() =>
      createRelationalToolSet({
        vendor: 'mysql',
        connection: { host: 'localhost', database: 'agentforge' },
      })
    ).not.toThrow();
    expect(() =>
      createRelationalToolSet({
        vendor: 'sqlite',
        connection: { url: ':memory:' },
      })
    ).not.toThrow();
    expect(connect).not.toHaveBeenCalled();
  });

  it('snapshots the database configuration at construction', async () => {
    const databasePath = temporaryDatabase();
    seedUsers(databasePath);
    const connection = { url: databasePath };
    const toolSet = createRelationalToolSet({ vendor: 'sqlite', connection });

    connection.url = join(databasePath, 'mutated');
    await expect(toolSet.query.invoke({ sql: 'SELECT name FROM users' })).resolves.toMatchObject({
      success: true,
      rowCount: 1,
    });

    await toolSet.dispose();
  });

  it('retains operation validation after credentials are removed', () => {
    const toolSet = createRelationalToolSet({ vendor: 'sqlite', connection: ':memory:' });

    expect(toolSet.update.schema.safeParse({ table: 'users', data: { name: 'Bob' } }).success).toBe(
      false
    );
    expect(toolSet.delete.schema.safeParse({ table: 'users' }).success).toBe(false);
    expect(toolSet.select.schema.safeParse({ table: '' }).success).toBe(false);
  });

  it('coalesces concurrent first use and reuses one SQLite session for all Tools', async () => {
    const databasePath = temporaryDatabase();
    seedUsers(databasePath);
    const connect = vi.spyOn(ConnectionManager.prototype, 'connect');
    const toolSet = createRelationalToolSet({ vendor: 'sqlite', connection: databasePath });

    const [firstQuery, secondQuery] = await Promise.all([
      toolSet.query.invoke({ sql: 'SELECT name FROM users WHERE id = ?', params: [1] }),
      toolSet.query.invoke({ sql: 'SELECT name FROM users WHERE id = ?', params: [1] }),
    ]);
    const inserted = await toolSet.insert.invoke({ table: 'users', data: { id: 2, name: 'Bob' } });
    const selected = await toolSet.select.invoke({
      table: 'users',
      orderBy: [{ column: 'id', direction: 'asc' }],
    });
    const updated = await toolSet.update.invoke({
      table: 'users',
      data: { name: 'Robert' },
      where: [{ column: 'id', operator: 'eq', value: 2 }],
    });
    const deleted = await toolSet.delete.invoke({
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    const schema = await toolSet.getSchema.invoke({});

    expect([firstQuery.success, secondQuery.success]).toEqual([true, true]);
    expect(inserted.success && inserted.rowCount).toBe(1);
    expect(selected.success && selected.rowCount).toBe(2);
    expect(updated.success && updated.rowCount).toBe(1);
    expect(deleted.success && deleted.rowCount).toBe(1);
    expect(schema.success && schema.summary.tableCount).toBe(1);
    expect(connect).toHaveBeenCalledTimes(1);

    await toolSet.dispose();
  });

  it('retries a failed first connection attempt', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'agentforge-tool-set-retry-'));
    temporaryDirectories.push(directory);
    const parent = join(directory, 'later');
    const toolSet = createRelationalToolSet({
      vendor: 'sqlite',
      connection: join(parent, 'database.sqlite'),
    });

    const connect = vi.spyOn(ConnectionManager.prototype, 'connect');
    const [firstFailure, secondFailure] = await Promise.all([
      toolSet.query.invoke({ sql: 'SELECT 1 AS value' }),
      toolSet.query.invoke({ sql: 'SELECT 1 AS value' }),
    ]);
    expect(firstFailure).toEqual(secondFailure);
    expect(firstFailure).toMatchObject({ success: false, rowCount: 0 });
    expect(firstFailure.success || firstFailure.error).not.toContain(parent);
    expect(connect).toHaveBeenCalledTimes(1);

    mkdirSync(parent);
    await expect(toolSet.query.invoke({ sql: 'SELECT 1 AS value' })).resolves.toMatchObject({
      success: true,
      rowCount: 1,
    });
    expect(connect).toHaveBeenCalledTimes(2);

    await toolSet.dispose();
  });

  it('owns schema refresh and clears cached state during disposal', async () => {
    const databasePath = temporaryDatabase();
    seedUsers(databasePath);
    const clearCache = vi.spyOn(SchemaCache.prototype, 'clear');
    const toolSet = createRelationalToolSet(
      { vendor: 'sqlite', connection: databasePath },
      { schemaCacheTtlMs: 60_000 }
    );

    const initial = await toolSet.getSchema.invoke({});
    const database = new Database(databasePath);
    database.exec('ALTER TABLE users ADD COLUMN email TEXT');
    database.close();
    const cached = await toolSet.getSchema.invoke({});
    toolSet.refreshSchema();
    const refreshed = await toolSet.getSchema.invoke({});

    const columnCount = (result: typeof initial) =>
      result.success ? result.schema.tables[0]?.columns.length : undefined;
    expect(columnCount(initial)).toBe(2);
    expect(columnCount(cached)).toBe(2);
    expect(columnCount(refreshed)).toBe(3);

    await toolSet.dispose();
    expect(clearCache).toHaveBeenCalledTimes(1);
  });

  it('rejects new work while disposal drains admitted work and closes once', async () => {
    const disposeConnection = vi.spyOn(ConnectionManager.prototype, 'dispose');
    const toolSet = createRelationalToolSet({ vendor: 'sqlite', connection: ':memory:' });
    const admitted = toolSet.query.invoke({ sql: 'SELECT 1 AS value' });
    const firstDisposal = toolSet.dispose();
    const secondDisposal = toolSet.dispose();

    await expect(toolSet.query.invoke({ sql: 'SELECT 2 AS value' })).rejects.toBeInstanceOf(
      RelationalToolSetDisposedError
    );
    await expect(admitted).resolves.toMatchObject({ success: true, rowCount: 1 });
    await expect(Promise.all([firstDisposal, secondDisposal])).resolves.toEqual([
      undefined,
      undefined,
    ]);
    expect(disposeConnection).toHaveBeenCalledTimes(1);
    await expect(toolSet.dispose()).resolves.toBeUndefined();
    expect(disposeConnection).toHaveBeenCalledTimes(1);
  });

  it('reports one deterministic disposal failure to every caller', async () => {
    const toolSet = createRelationalToolSet({ vendor: 'sqlite', connection: ':memory:' });
    await toolSet.query.invoke({ sql: 'SELECT 1 AS value' });
    const failure = new Error('close failed');
    const disposeConnection = vi
      .spyOn(ConnectionManager.prototype, 'dispose')
      .mockRejectedValueOnce(failure);

    const firstDisposal = toolSet.dispose();
    const secondDisposal = toolSet.dispose();
    await expect(firstDisposal).rejects.toBe(failure);
    await expect(secondDisposal).rejects.toBe(failure);
    await expect(toolSet.dispose()).rejects.toBe(failure);
    expect(disposeConnection).toHaveBeenCalledTimes(1);
    await expect(toolSet.query.invoke({ sql: 'SELECT 2 AS value' })).rejects.toBeInstanceOf(
      RelationalToolSetDisposedError
    );
  });
});
