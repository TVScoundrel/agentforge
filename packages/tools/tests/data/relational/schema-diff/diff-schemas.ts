import { describe, expect, it } from 'vitest';

import { diffSchemas } from '../../../../src/data/relational/schema/schema-diff.js';
import { makeSchema } from './shared.js';

describe('schema-diff > diffSchemas', () => {
  it('should report identical schemas', () => {
    const schema = makeSchema();
    const result = diffSchemas(schema, schema);
    expect(result.identical).toBe(true);
    expect(result.tables).toHaveLength(0);
    expect(result.summary.tablesAdded).toBe(0);
  });

  it('should detect added table', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        ...before.tables,
        {
          name: 'orders',
          columns: [{ name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true }],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: [],
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.identical).toBe(false);
    expect(result.summary.tablesAdded).toBe(1);
    expect(result.tables.find((table) => table.table === 'orders')?.type).toBe('added');
  });

  it('should detect removed table', () => {
    const result = diffSchemas(makeSchema(), makeSchema({ tables: [] }));
    expect(result.identical).toBe(false);
    expect(result.summary.tablesRemoved).toBe(1);
  });

  it('should detect added column', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          columns: [
            ...before.tables[0].columns,
            { name: 'age', type: 'integer', isNullable: true, defaultValue: null, isPrimaryKey: false },
          ],
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.identical).toBe(false);
    expect(result.summary.tablesChanged).toBe(1);
    expect(result.summary.columnsAdded).toBe(1);
    expect(result.tables[0].columns?.find((column) => column.column === 'age')?.type).toBe('added');
  });

  it('should detect removed column', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          columns: before.tables[0].columns.filter((column) => column.name !== 'email'),
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.summary.columnsRemoved).toBe(1);
    expect(result.tables[0].columns?.find((column) => column.column === 'email')?.type).toBe('removed');
  });

  it('should detect changed column properties', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          columns: before.tables[0].columns.map((column) =>
            column.name === 'name' ? { ...column, type: 'varchar(255)', isNullable: true } : column,
          ),
        },
      ],
    });

    const result = diffSchemas(before, after);
    const diff = result.tables[0].columns?.find((column) => column.column === 'name');

    expect(result.summary.columnsChanged).toBe(1);
    expect(diff?.type).toBe('changed');
    expect(diff?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'type', before: 'text', after: 'varchar(255)' }),
        expect.objectContaining({ property: 'isNullable', before: false, after: true }),
      ]),
    );
  });

  it('should detect primary key membership changes', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [{ ...before.tables[0], primaryKey: ['id', 'name'] }],
    });

    const result = diffSchemas(before, after);
    expect(result.tables[0].primaryKeyChanged).toEqual({
      before: ['id'],
      after: ['id', 'name'],
    });
  });

  it('should detect primary key order changes', () => {
    const baseTable = makeSchema().tables[0];
    const before = makeSchema({ tables: [{ ...baseTable, primaryKey: ['id', 'name'] }] });
    const after = makeSchema({ tables: [{ ...baseTable, primaryKey: ['name', 'id'] }] });

    const result = diffSchemas(before, after);
    expect(result.identical).toBe(false);
    expect(result.tables[0].primaryKeyChanged).toEqual({
      before: ['id', 'name'],
      after: ['name', 'id'],
    });
  });

  it('should compare table names case-insensitively', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [{ ...before.tables[0], name: 'USERS' }],
    });

    const result = diffSchemas(before, after);
    expect(result.identical).toBe(true);
  });
});
