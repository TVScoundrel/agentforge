/**
 * Unit tests for schema-diff (diff, export, import).
 */

import { describe, expect, it } from 'vitest';
import type { DatabaseSchema } from '../../../src/data/relational/schema/types.js';
import {
  diffSchemas,
  exportSchemaToJson,
  importSchemaFromJson,
} from '../../../src/data/relational/schema/schema-diff.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeSchema(overrides?: Partial<DatabaseSchema>): DatabaseSchema {
  return {
    vendor: 'postgresql',
    generatedAt: '2026-02-19T00:00:00Z',
    tables: [
      {
        name: 'users',
        schema: 'public',
        columns: [
          { name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true },
          { name: 'name', type: 'text', isNullable: false, defaultValue: null, isPrimaryKey: false },
          { name: 'email', type: 'text', isNullable: true, defaultValue: null, isPrimaryKey: false },
        ],
        primaryKey: ['id'],
        foreignKeys: [],
        indexes: [],
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// diffSchemas
// ---------------------------------------------------------------------------

describe('schema-diff > diffSchemas', () => {
  it('should report identical schemas', () => {
    const s = makeSchema();
    const result = diffSchemas(s, s);
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
          columns: [
            { name: 'id', type: 'integer', isNullable: false, defaultValue: null, isPrimaryKey: true },
          ],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: [],
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.identical).toBe(false);
    expect(result.summary.tablesAdded).toBe(1);
    expect(result.tables.find((t) => t.table === 'orders')?.type).toBe('added');
  });

  it('should detect removed table', () => {
    const before = makeSchema();
    const after = makeSchema({ tables: [] });
    const result = diffSchemas(before, after);
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
    const tableDiff = result.tables[0];
    expect(tableDiff.columns?.find((c) => c.column === 'age')?.type).toBe('added');
  });

  it('should detect removed column', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          columns: before.tables[0].columns.filter((c) => c.name !== 'email'),
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.summary.columnsRemoved).toBe(1);
    expect(result.tables[0].columns?.find((c) => c.column === 'email')?.type).toBe('removed');
  });

  it('should detect column type change', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          columns: before.tables[0].columns.map((c) =>
            c.name === 'name' ? { ...c, type: 'varchar(255)' } : c,
          ),
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.summary.columnsChanged).toBe(1);
    const colDiff = result.tables[0].columns?.find((c) => c.column === 'name');
    expect(colDiff?.type).toBe('changed');
    expect(colDiff?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'type', before: 'text', after: 'varchar(255)' }),
      ]),
    );
  });

  it('should detect nullable change', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          columns: before.tables[0].columns.map((c) =>
            c.name === 'name' ? { ...c, isNullable: true } : c,
          ),
        },
      ],
    });

    const result = diffSchemas(before, after);
    const colDiff = result.tables[0].columns?.find((c) => c.column === 'name');
    expect(colDiff?.changes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'isNullable', before: false, after: true }),
      ]),
    );
  });

  it('should detect primary key change', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [
        {
          ...before.tables[0],
          primaryKey: ['id', 'name'],
        },
      ],
    });

    const result = diffSchemas(before, after);
    expect(result.tables[0].primaryKeyChanged).toEqual({
      before: ['id'],
      after: ['id', 'name'],
    });
  });

  it('should handle case-insensitive table comparison', () => {
    const before = makeSchema();
    const after = makeSchema({
      tables: [{ ...before.tables[0], name: 'USERS' }],
    });

    // Same table (case-insensitive), no diff
    const result = diffSchemas(before, after);
    expect(result.identical).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// exportSchemaToJson / importSchemaFromJson
// ---------------------------------------------------------------------------

describe('schema-diff > JSON export/import', () => {
  it('should round-trip a schema through JSON', () => {
    const schema = makeSchema();
    const json = exportSchemaToJson(schema);
    const imported = importSchemaFromJson(json);
    expect(imported).toEqual(schema);
  });

  it('should produce deterministic JSON output', () => {
    const schema = makeSchema();
    const json1 = exportSchemaToJson(schema);
    const json2 = exportSchemaToJson(schema);
    expect(json1).toBe(json2);
  });

  it('should throw on invalid JSON string', () => {
    expect(() => importSchemaFromJson('not-json')).toThrow();
  });

  it('should throw when vendor is missing', () => {
    expect(() => importSchemaFromJson('{"tables":[],"generatedAt":"x"}')).toThrow('vendor');
  });

  it('should throw when tables is not an array', () => {
    expect(() => importSchemaFromJson('{"vendor":"postgresql","tables":"bad","generatedAt":"x"}')).toThrow(
      'tables',
    );
  });

  it('should throw when generatedAt is missing', () => {
    expect(() => importSchemaFromJson('{"vendor":"postgresql","tables":[]}')).toThrow('generatedAt');
  });

  it('should throw when a table has no name', () => {
    const json = JSON.stringify({
      vendor: 'postgresql',
      generatedAt: 'x',
      tables: [{ columns: [], primaryKey: [] }],
    });
    expect(() => importSchemaFromJson(json)).toThrow('name');
  });

  it('should throw when a table has no columns array', () => {
    const json = JSON.stringify({
      vendor: 'postgresql',
      generatedAt: 'x',
      tables: [{ name: 'users', primaryKey: [] }],
    });
    expect(() => importSchemaFromJson(json)).toThrow('columns');
  });

  it('should throw when a table has no primaryKey array', () => {
    const json = JSON.stringify({
      vendor: 'postgresql',
      generatedAt: 'x',
      tables: [{ name: 'users', columns: [] }],
    });
    expect(() => importSchemaFromJson(json)).toThrow('primaryKey');
  });
});
