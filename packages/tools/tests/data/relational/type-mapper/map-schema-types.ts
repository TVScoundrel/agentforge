import { describe, expect, it } from 'vitest';
import { mapSchemaTypes } from '../../../../src/data/relational/schema/type-mapper.js';

describe('type-mapper > mapSchemaTypes', () => {
  it('maps multiple columns across tables', () => {
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
