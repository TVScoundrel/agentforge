/**
 * Tests for relational SELECT schema validation (superRefine logic)
 */
import { describe, it, expect } from 'vitest';
import {
  whereConditionSchema,
  orderBySchema,
  streamingOptionsSchema,
  relationalSelectSchema,
} from '../../../../src/data/relational/tools/relational-select/schemas.js';

const baseValid = {
  table: 'users',
  vendor: 'postgresql' as const,
  connectionString: 'postgresql://localhost/test',
};

describe('whereConditionSchema', () => {
  it('accepts eq with string', () => {
    const result = whereConditionSchema.safeParse({ column: 'name', operator: 'eq', value: 'Alice' });
    expect(result.success).toBe(true);
  });

  it('accepts ne with number', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'ne', value: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects isNull with value', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'isNull', value: 'x' });
    expect(result.success).toBe(false);
  });

  it('accepts isNull without value', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'isNull' });
    expect(result.success).toBe(true);
  });

  it('accepts isNotNull without value', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'isNotNull' });
    expect(result.success).toBe(true);
  });

  it('rejects eq without value', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'eq' });
    expect(result.success).toBe(false);
  });

  it('accepts in with array', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'in', value: [1, 2, 3] });
    expect(result.success).toBe(true);
  });

  it('rejects in with non-array', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'in', value: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects in with empty array', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'in', value: [] });
    expect(result.success).toBe(false);
  });

  it('rejects notIn with non-array', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'notIn', value: 5 });
    expect(result.success).toBe(false);
  });

  it('rejects notIn with empty array', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'notIn', value: [] });
    expect(result.success).toBe(false);
  });

  it('rejects eq with null', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'eq', value: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('null is only allowed with isNull/isNotNull');
    }
  });

  it('rejects like with non-string', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'like', value: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts like with string', () => {
    const result = whereConditionSchema.safeParse({ column: 'name', operator: 'like', value: '%test%' });
    expect(result.success).toBe(true);
  });

  it('rejects gt with boolean', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'gt', value: true });
    expect(result.success).toBe(false);
  });

  it('rejects lt with boolean', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'lt', value: false });
    expect(result.success).toBe(false);
  });

  it('rejects gte with boolean', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'gte', value: true });
    expect(result.success).toBe(false);
  });

  it('rejects lte with boolean', () => {
    const result = whereConditionSchema.safeParse({ column: 'c', operator: 'lte', value: false });
    expect(result.success).toBe(false);
  });

  it('rejects eq with array value (should use in)', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'eq', value: [1, 2] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('EQ operator requires a scalar value');
    }
  });

  it('rejects ne with array value (should use notIn)', () => {
    const result = whereConditionSchema.safeParse({ column: 'id', operator: 'ne', value: [1, 2] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('NE operator requires a scalar value');
    }
  });

  it('accepts gt with number', () => {
    const result = whereConditionSchema.safeParse({ column: 'age', operator: 'gt', value: 18 });
    expect(result.success).toBe(true);
  });

  it('accepts lte with string', () => {
    const result = whereConditionSchema.safeParse({ column: 'name', operator: 'lte', value: 'z' });
    expect(result.success).toBe(true);
  });
});

describe('orderBySchema', () => {
  it('accepts valid asc order', () => {
    const result = orderBySchema.safeParse({ column: 'name', direction: 'asc' });
    expect(result.success).toBe(true);
  });

  it('accepts valid desc order', () => {
    const result = orderBySchema.safeParse({ column: 'id', direction: 'desc' });
    expect(result.success).toBe(true);
  });

  it('rejects empty column', () => {
    const result = orderBySchema.safeParse({ column: '', direction: 'asc' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid direction', () => {
    const result = orderBySchema.safeParse({ column: 'id', direction: 'up' });
    expect(result.success).toBe(false);
  });
});

describe('streamingOptionsSchema', () => {
  it('applies defaults', () => {
    const result = streamingOptionsSchema.parse({});
    expect(result.enabled).toBe(true);
    expect(result.benchmark).toBe(false);
  });

  it('rejects chunkSize > 5000', () => {
    const result = streamingOptionsSchema.safeParse({ chunkSize: 10000 });
    expect(result.success).toBe(false);
  });

  it('rejects chunkSize < 1', () => {
    const result = streamingOptionsSchema.safeParse({ chunkSize: 0 });
    expect(result.success).toBe(false);
  });

  it('accepts maxRows', () => {
    const result = streamingOptionsSchema.safeParse({ maxRows: 500 });
    expect(result.success).toBe(true);
  });

  it('accepts sampleSize', () => {
    const result = streamingOptionsSchema.safeParse({ sampleSize: 10 });
    expect(result.success).toBe(true);
  });

  it('rejects sampleSize > 5000', () => {
    const result = streamingOptionsSchema.safeParse({ sampleSize: 6000 });
    expect(result.success).toBe(false);
  });
});

describe('relationalSelectSchema', () => {
  it('accepts basic select', () => {
    const result = relationalSelectSchema.safeParse(baseValid);
    expect(result.success).toBe(true);
  });

  it('accepts select with columns', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      columns: ['id', 'name'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty column name in columns array', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      columns: ['id', ''],
    });
    expect(result.success).toBe(false);
  });

  it('accepts select with where, orderBy, limit, offset', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      where: [{ column: 'active', operator: 'eq', value: true }],
      orderBy: [{ column: 'name', direction: 'asc' }],
      limit: 10,
      offset: 20,
    });
    expect(result.success).toBe(true);
  });

  it('accepts select with streaming options', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      streaming: { enabled: true, chunkSize: 50 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid table name', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      table: 'DROP TABLE;',
    });
    expect(result.success).toBe(false);
  });

  it('accepts schema-qualified table name', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      table: 'public.users',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative offset', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      offset: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive limit', () => {
    const result = relationalSelectSchema.safeParse({
      ...baseValid,
      limit: 0,
    });
    expect(result.success).toBe(false);
  });
});
