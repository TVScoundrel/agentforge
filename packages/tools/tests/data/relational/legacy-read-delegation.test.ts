import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createRelationalToolSet: vi.fn(),
  createRelationalToolSetWithSharedSchemaCache: vi.fn(),
  query: vi.fn(),
  select: vi.fn(),
  getSchema: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock('../../../src/data/relational/tool-set.js', () => ({
  createRelationalToolSet: mocks.createRelationalToolSet,
  createRelationalToolSetWithSharedSchemaCache:
    mocks.createRelationalToolSetWithSharedSchemaCache,
}));

import {
  relationalGetSchema,
  relationalQuery,
  relationalSelect,
} from '../../../src/data/relational/tools/index.js';

describe('legacy Relational read Tool delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRelationalToolSet.mockReturnValue({
      query: { invoke: mocks.query },
      select: { invoke: mocks.select },
      getSchema: { invoke: mocks.getSchema },
      dispose: mocks.dispose,
    });
    mocks.createRelationalToolSetWithSharedSchemaCache.mockReturnValue({
      query: { invoke: mocks.query },
      select: { invoke: mocks.select },
      getSchema: { invoke: mocks.getSchema },
      dispose: mocks.dispose,
    });
    mocks.query.mockResolvedValue({ success: true, rows: [], rowCount: 0, executionTime: 1 });
    mocks.select.mockResolvedValue({ success: true, rows: [], rowCount: 0, executionTime: 1 });
    mocks.getSchema.mockResolvedValue({
      success: true,
      schema: { vendor: 'postgresql', tables: [], generatedAt: new Date() },
      summary: { tableCount: 0, columnCount: 0, foreignKeyCount: 0, indexCount: 0 },
    });
    mocks.dispose.mockResolvedValue(undefined);
  });

  it('delegates Query without credentials', async () => {
    await relationalQuery.invoke({
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/agentforge',
      sql: 'SELECT * FROM users WHERE id = $1',
      params: [42],
    });

    expect(mocks.createRelationalToolSet).toHaveBeenCalledWith(
      { vendor: 'postgresql', connection: 'postgresql://localhost/agentforge' },
      {},
    );
    expect(mocks.query).toHaveBeenCalledWith({
      sql: 'SELECT * FROM users WHERE id = $1',
      params: [42],
    });
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('delegates Select without credentials', async () => {
    await relationalSelect.invoke({
      vendor: 'mysql',
      connectionString: 'mysql://localhost/agentforge',
      table: 'users',
      columns: ['id'],
      limit: 5,
    });

    expect(mocks.createRelationalToolSet).toHaveBeenCalledWith(
      { vendor: 'mysql', connection: 'mysql://localhost/agentforge' },
      {},
    );
    expect(mocks.select).toHaveBeenCalledWith({ table: 'users', columns: ['id'], limit: 5 });
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });

  it('maps Get Schema cache controls and strips credential cache scope', async () => {
    await relationalGetSchema.invoke({
      vendor: 'sqlite',
      connectionString: 'database.sqlite',
      database: 'legacy-cache-scope',
      tables: ['users'],
      cacheTtlMs: 5_000,
      refreshCache: true,
    });

    expect(mocks.createRelationalToolSetWithSharedSchemaCache).toHaveBeenCalledWith(
      { vendor: 'sqlite', connection: 'database.sqlite' },
      { schemaCacheTtlMs: 5_000 },
      expect.stringMatching(/^sqlite:legacy-cache-scope:[a-f0-9]{64}$/),
    );
    expect(mocks.getSchema).toHaveBeenCalledWith({ tables: ['users'], refreshCache: true });
    expect(mocks.dispose).toHaveBeenCalledOnce();
  });
});
