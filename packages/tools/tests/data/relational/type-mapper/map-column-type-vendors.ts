import { describe, expect, it } from 'vitest';
import { mapColumnType } from '../../../../src/data/relational/schema/type-mapper.js';

describe('type-mapper > mapColumnType > postgresql', () => {
  it('maps core PostgreSQL scalar types', () => {
    expect(mapColumnType('postgresql', 'integer')).toMatchObject({
      tsType: 'number',
      nullable: false,
      dbType: 'integer',
    });
    expect(mapColumnType('postgresql', 'text').tsType).toBe('string');
    expect(mapColumnType('postgresql', 'boolean').tsType).toBe('boolean');
    expect(mapColumnType('postgresql', 'jsonb').tsType).toBe('unknown');
    expect(mapColumnType('postgresql', 'bytea').tsType).toBe('Buffer');
    expect(mapColumnType('postgresql', 'uuid').tsType).toBe('string');
    expect(mapColumnType('postgresql', 'timestamp with time zone').tsType).toBe('string');
    expect(mapColumnType('postgresql', 'numeric').tsType).toBe('string');
  });

  it('preserves precision-loss notes for bigint-like PostgreSQL types', () => {
    expect(mapColumnType('postgresql', 'bigint')).toMatchObject({
      tsType: 'string',
      notes: expect.stringContaining('precision'),
    });
    expect(mapColumnType('postgresql', 'bigserial').notes).toContain('precision');
  });

  it('returns unknown with a note for unmapped PostgreSQL types', () => {
    const result = mapColumnType('postgresql', 'my_custom_enum');
    expect(result.tsType).toBe('unknown');
    expect(result.notes).toContain('No explicit mapping');
  });
});

describe('type-mapper > mapColumnType > mysql', () => {
  it('maps core MySQL scalar types', () => {
    expect(mapColumnType('mysql', 'int').tsType).toBe('number');
    expect(mapColumnType('mysql', 'varchar').tsType).toBe('string');
    expect(mapColumnType('mysql', 'json').tsType).toBe('unknown');
    expect(mapColumnType('mysql', 'blob').tsType).toBe('Buffer');
    expect(mapColumnType('mysql', 'datetime').tsType).toBe('string');
    expect(mapColumnType('mysql', 'tinyint').tsType).toBe('number');
  });

  it('preserves precision-loss notes for MySQL bigint', () => {
    const result = mapColumnType('mysql', 'bigint');
    expect(result.tsType).toBe('string');
    expect(result.notes).toContain('precision');
  });
});

describe('type-mapper > mapColumnType > sqlite', () => {
  it('maps core SQLite declared types', () => {
    expect(mapColumnType('sqlite', 'INTEGER').tsType).toBe('number');
    expect(mapColumnType('sqlite', 'TEXT').tsType).toBe('string');
    expect(mapColumnType('sqlite', 'REAL').tsType).toBe('number');
    expect(mapColumnType('sqlite', 'BLOB').tsType).toBe('Buffer');
  });

  it('preserves SQLite boolean semantics as numeric storage', () => {
    expect(mapColumnType('sqlite', 'boolean').tsType).toBe('number');
  });
});
