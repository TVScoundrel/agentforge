/**
 * Unit tests for SchemaInspector.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConnectionManager } from '../../../src/data/relational/connection/connection-manager.js';
import { SchemaInspector } from '../../../src/data/relational/schema/schema-inspector.js';

function createMockManager(queue: Array<{ rows: unknown[] }>): {
  manager: ConnectionManager;
  executeMock: ReturnType<typeof vi.fn>;
} {
  const executeMock = vi.fn();
  for (const result of queue) {
    executeMock.mockResolvedValueOnce(result);
  }

  const manager = { execute: executeMock } as unknown as ConnectionManager;
  return { manager, executeMock };
}

describe('SchemaInspector', () => {
  beforeEach(() => {
    SchemaInspector.clearCache();
  });

  it('should introspect PostgreSQL tables, columns, keys, and indexes', async () => {
    const { manager, executeMock } = createMockManager([
      { rows: [{ schema_name: 'public', table_name: 'users' }] },
      {
        rows: [
          {
            schema_name: 'public',
            table_name: 'users',
            column_name: 'id',
            data_type: 'integer',
            is_nullable: 'NO',
            column_default: null,
          },
          {
            schema_name: 'public',
            table_name: 'users',
            column_name: 'email',
            data_type: 'text',
            is_nullable: 'YES',
            column_default: null,
          },
        ],
      },
      {
        rows: [{ schema_name: 'public', table_name: 'users', column_name: 'id', key_position: 1 }],
      },
      {
        rows: [
          {
            schema_name: 'public',
            table_name: 'users',
            constraint_name: 'users_role_id_fkey',
            column_name: 'role_id',
            referenced_schema_name: 'public',
            referenced_table_name: 'roles',
            referenced_column_name: 'id',
          },
        ],
      },
      {
        rows: [
          {
            schema_name: 'public',
            table_name: 'users',
            index_name: 'idx_users_email',
            is_unique: true,
            column_name: 'email',
            column_position: 1,
          },
        ],
      },
    ]);

    const inspector = new SchemaInspector(manager, 'postgresql', {
      cacheKey: 'pg:test',
      cacheTtlMs: 30_000,
    });

    const schema = await inspector.inspect();
    expect(schema.vendor).toBe('postgresql');
    expect(schema.tables).toHaveLength(1);
    expect(schema.tables[0].name).toBe('users');
    expect(schema.tables[0].schema).toBe('public');
    expect(schema.tables[0].columns).toHaveLength(2);
    expect(schema.tables[0].primaryKey).toEqual(['id']);
    expect(schema.tables[0].foreignKeys).toHaveLength(1);
    expect(schema.tables[0].indexes).toEqual([
      { name: 'idx_users_email', isUnique: true, columns: ['email'] },
    ]);
    expect(schema.tables[0].columns.find((column) => column.name === 'id')?.isPrimaryKey).toBe(true);
    expect(executeMock).toHaveBeenCalledTimes(5);
  });

  it('should use cache and support explicit cache invalidation', async () => {
    const queue = [
      { rows: [{ schema_name: 'public', table_name: 'users' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [{ schema_name: 'public', table_name: 'users' }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ];
    const { manager, executeMock } = createMockManager(queue);
    const inspector = new SchemaInspector(manager, 'postgresql', {
      cacheKey: 'pg:cache-test',
      cacheTtlMs: 60_000,
    });

    await inspector.inspect();
    await inspector.inspect();
    expect(executeMock).toHaveBeenCalledTimes(5);

    inspector.invalidateCache();
    await inspector.inspect();
    expect(executeMock).toHaveBeenCalledTimes(10);
  });

  it('should filter tables and validate table filter syntax', async () => {
    const { manager, executeMock } = createMockManager([
      {
        rows: [
          { schema_name: 'public', table_name: 'users' },
          { schema_name: 'public', table_name: 'orders' },
        ],
      },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);
    const inspector = new SchemaInspector(manager, 'postgresql');

    await expect(
      inspector.inspect({ tables: ['invalid-table-name!'] }),
    ).rejects.toThrow(/Invalid table filter/);
    expect(executeMock).toHaveBeenCalledTimes(0);

    const filtered = await inspector.inspect({ tables: ['public.orders'] });
    expect(filtered.tables).toHaveLength(1);
    expect(filtered.tables[0].name).toBe('orders');
  });
});
