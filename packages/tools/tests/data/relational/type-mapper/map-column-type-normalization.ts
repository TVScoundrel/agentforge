import { describe, expect, it } from 'vitest';
import { mapColumnType } from '../../../../src/data/relational/schema/type-mapper.js';

describe('type-mapper > mapColumnType > normalization', () => {
  it('strips size and precision suffixes before lookup', () => {
    expect(mapColumnType('postgresql', 'varchar(255)').tsType).toBe('string');
    expect(mapColumnType('postgresql', 'numeric(10,2)').tsType).toBe('string');
  });

  it('strips array suffixes before lookup', () => {
    expect(mapColumnType('postgresql', 'integer[]').tsType).toBe('number');
  });

  it('strips unsigned suffixes before lookup', () => {
    expect(mapColumnType('mysql', 'int unsigned').tsType).toBe('number');
  });

  it('preserves nullable output flags', () => {
    const result = mapColumnType('postgresql', 'integer', true);
    expect(result.tsType).toBe('number');
    expect(result.nullable).toBe(true);
  });
});
