/**
 * Unit tests for type-mapper.
 */

import { describe, expect, it } from 'vitest';
import {
  mapColumnType,
  mapSchemaTypes,
  getVendorTypeMap,
} from '../../../src/data/relational/schema/type-mapper.js';

// ---------------------------------------------------------------------------
// mapColumnType — PostgreSQL
// ---------------------------------------------------------------------------

describe('type-mapper > mapColumnType > postgresql', () => {
  it('should map integer to number', () => {
    const result = mapColumnType('postgresql', 'integer');
    expect(result.tsType).toBe('number');
    expect(result.nullable).toBe(false);
    expect(result.dbType).toBe('integer');
  });

  it('should map bigint to string (precision safety)', () => {
    const result = mapColumnType('postgresql', 'bigint');
    expect(result.tsType).toBe('string');
    expect(result.notes).toContain('precision');
  });

  it('should map text to string', () => {
    expect(mapColumnType('postgresql', 'text').tsType).toBe('string');
  });

  it('should map boolean to boolean', () => {
    expect(mapColumnType('postgresql', 'boolean').tsType).toBe('boolean');
  });

  it('should map jsonb to unknown', () => {
    expect(mapColumnType('postgresql', 'jsonb').tsType).toBe('unknown');
  });

  it('should map bytea to Buffer', () => {
    expect(mapColumnType('postgresql', 'bytea').tsType).toBe('Buffer');
  });

  it('should map uuid to string', () => {
    expect(mapColumnType('postgresql', 'uuid').tsType).toBe('string');
  });

  it('should map timestamp with time zone to string', () => {
    expect(mapColumnType('postgresql', 'timestamp with time zone').tsType).toBe('string');
  });

  it('should map numeric to string (arbitrary precision)', () => {
    expect(mapColumnType('postgresql', 'numeric').tsType).toBe('string');
  });

  it('should strip size suffix: varchar(255) → string', () => {
    const result = mapColumnType('postgresql', 'varchar(255)');
    expect(result.tsType).toBe('string');
  });

  it('should strip precision suffix: numeric(10,2)', () => {
    const result = mapColumnType('postgresql', 'numeric(10,2)');
    expect(result.tsType).toBe('string');
  });

  it('should handle nullable flag', () => {
    const result = mapColumnType('postgresql', 'integer', true);
    expect(result.tsType).toBe('number');
    expect(result.nullable).toBe(true);
  });

  it('should return unknown for unmapped types with a note', () => {
    const result = mapColumnType('postgresql', 'my_custom_enum');
    expect(result.tsType).toBe('unknown');
    expect(result.notes).toContain('No explicit mapping');
  });
});

// ---------------------------------------------------------------------------
// mapColumnType — MySQL
// ---------------------------------------------------------------------------

describe('type-mapper > mapColumnType > mysql', () => {
  it('should map int to number', () => {
    expect(mapColumnType('mysql', 'int').tsType).toBe('number');
  });

  it('should map bigint to string', () => {
    expect(mapColumnType('mysql', 'bigint').tsType).toBe('string');
  });

  it('should map varchar to string', () => {
    expect(mapColumnType('mysql', 'varchar').tsType).toBe('string');
  });

  it('should map json to unknown', () => {
    expect(mapColumnType('mysql', 'json').tsType).toBe('unknown');
  });

  it('should map blob to Buffer', () => {
    expect(mapColumnType('mysql', 'blob').tsType).toBe('Buffer');
  });

  it('should map datetime to string', () => {
    expect(mapColumnType('mysql', 'datetime').tsType).toBe('string');
  });

  it('should strip unsigned suffix', () => {
    const result = mapColumnType('mysql', 'int unsigned');
    expect(result.tsType).toBe('number');
  });

  it('should map tinyint to number', () => {
    expect(mapColumnType('mysql', 'tinyint').tsType).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// mapColumnType — SQLite
// ---------------------------------------------------------------------------

describe('type-mapper > mapColumnType > sqlite', () => {
  it('should map INTEGER to number', () => {
    expect(mapColumnType('sqlite', 'INTEGER').tsType).toBe('number');
  });

  it('should map TEXT to string', () => {
    expect(mapColumnType('sqlite', 'TEXT').tsType).toBe('string');
  });

  it('should map REAL to number', () => {
    expect(mapColumnType('sqlite', 'REAL').tsType).toBe('number');
  });

  it('should map BLOB to Buffer', () => {
    expect(mapColumnType('sqlite', 'BLOB').tsType).toBe('Buffer');
  });

  it('should map boolean to number (SQLite stores as 0/1)', () => {
    expect(mapColumnType('sqlite', 'boolean').tsType).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// mapSchemaTypes
// ---------------------------------------------------------------------------

describe('type-mapper > mapSchemaTypes', () => {
  it('should map multiple columns across tables', () => {
    const result = mapSchemaTypes('postgresql', [
      { table: 'users', name: 'id', type: 'integer', nullable: false },
      { table: 'users', name: 'name', type: 'text', nullable: false },
      { table: 'orders', name: 'total', type: 'numeric(10,2)', nullable: true },
    ]);

    expect(result.size).toBe(2);
    expect(result.get('users')!.get('id')!.tsType).toBe('number');
    expect(result.get('users')!.get('name')!.tsType).toBe('string');
    expect(result.get('orders')!.get('total')!.tsType).toBe('string');
    expect(result.get('orders')!.get('total')!.nullable).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getVendorTypeMap
// ---------------------------------------------------------------------------

describe('type-mapper > getVendorTypeMap', () => {
  it('should return PostgreSQL type map', () => {
    const map = getVendorTypeMap('postgresql');
    expect(map.integer).toBe('number');
    expect(map.text).toBe('string');
    expect(map.boolean).toBe('boolean');
  });

  it('should return MySQL type map', () => {
    const map = getVendorTypeMap('mysql');
    expect(map.int).toBe('number');
    expect(map.varchar).toBe('string');
  });

  it('should return SQLite type map', () => {
    const map = getVendorTypeMap('sqlite');
    expect(map.integer).toBe('number');
    expect(map.text).toBe('string');
  });

  it('should return a copy (not mutable reference)', () => {
    const map1 = getVendorTypeMap('postgresql');
    const map2 = getVendorTypeMap('postgresql');
    (map1 as Record<string, string>).integer = 'CHANGED';
    expect(map2.integer).toBe('number');
  });
});
