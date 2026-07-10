import { describe, expect, it } from 'vitest';
import { getVendorTypeMap } from '../../../../src/data/relational/schema/type-mapper.js';

describe('type-mapper > getVendorTypeMap', () => {
  it('returns PostgreSQL type mappings', () => {
    const map = getVendorTypeMap('postgresql');
    expect(map.integer).toBe('number');
    expect(map.text).toBe('string');
    expect(map.boolean).toBe('boolean');
  });

  it('returns MySQL type mappings', () => {
    const map = getVendorTypeMap('mysql');
    expect(map.int).toBe('number');
    expect(map.varchar).toBe('string');
  });

  it('returns SQLite type mappings', () => {
    const map = getVendorTypeMap('sqlite');
    expect(map.integer).toBe('number');
    expect(map.text).toBe('string');
  });

  it('returns a defensive copy instead of a mutable shared reference', () => {
    const map1 = getVendorTypeMap('postgresql') as Record<string, string>;
    const map2 = getVendorTypeMap('postgresql');
    map1.integer = 'CHANGED';
    expect(map2.integer).toBe('number');
  });
});
