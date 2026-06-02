/**
 * PostgreSQL-focused SchemaInspector coverage.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { SchemaInspector } from '../../../src/data/relational/schema/schema-inspector.js';
import { createMockManager } from './schema-inspector.test-utils.js';

describe('SchemaInspector PostgreSQL introspection', () => {
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
});
