/**
 * Tests for relational DELETE schema validation (superRefine logic)
 */
import { describe, it, expect } from 'vitest';
import {
  deleteWhereConditionSchema,
  deleteBatchOperationSchema,
  relationalDeleteSchema,
  deleteSoftDeleteSchema,
  deleteBatchOptionsSchema,
} from '../../../../src/data/relational/tools/relational-delete/schemas.js';

const baseValid = {
  table: 'users',
  vendor: 'postgresql' as const,
  connectionString: 'postgresql://localhost/test',
};

describe('deleteWhereConditionSchema', () => {
  it('accepts eq with string value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'eq', value: '1' });
    expect(result.success).toBe(true);
  });

  it('accepts isNull without value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'deleted_at', operator: 'isNull' });
    expect(result.success).toBe(true);
  });

  it('accepts isNotNull without value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'name', operator: 'isNotNull' });
    expect(result.success).toBe(true);
  });

  it('rejects isNull with value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'isNull', value: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('value must not be provided');
    }
  });

  it('rejects isNotNull with value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'isNotNull', value: 1 });
    expect(result.success).toBe(false);
  });

  it('rejects eq without value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'eq' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('value is required');
    }
  });

  it('accepts in with array', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'in', value: [1, 2] });
    expect(result.success).toBe(true);
  });

  it('rejects in with non-array', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'in', value: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('IN operator requires an array value');
    }
  });

  it('rejects in with empty array', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'in', value: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('non-empty array');
    }
  });

  it('rejects notIn with non-array', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'notIn', value: 5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('NOT IN operator requires an array value');
    }
  });

  it('rejects notIn with empty array', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'notIn', value: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('NOT IN operator requires a non-empty array');
    }
  });

  it('rejects eq with null (should use isNull)', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'eq', value: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('null is only allowed with isNull/isNotNull');
    }
  });

  it('rejects like with non-string value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'like', value: 123 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('LIKE operator requires a string value');
    }
  });

  it('accepts like with string value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'like', value: '%test%' });
    expect(result.success).toBe(true);
  });

  it('rejects gt with boolean value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'gt', value: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('GT operator requires a string or number value');
    }
  });

  it('rejects lt with boolean value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'lt', value: false });
    expect(result.success).toBe(false);
  });

  it('rejects gte with boolean value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'gte', value: true });
    expect(result.success).toBe(false);
  });

  it('rejects lte with boolean value', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'c', operator: 'lte', value: false });
    expect(result.success).toBe(false);
  });

  it('accepts gt with number', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'age', operator: 'gt', value: 18 });
    expect(result.success).toBe(true);
  });

  it('accepts lte with string', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'name', operator: 'lte', value: 'z' });
    expect(result.success).toBe(true);
  });

  it('rejects empty column name', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: '', operator: 'eq', value: 1 });
    expect(result.success).toBe(false);
  });

  it('accepts ne with number', () => {
    const result = deleteWhereConditionSchema.safeParse({ column: 'id', operator: 'ne', value: 0 });
    expect(result.success).toBe(true);
  });
});

describe('deleteSoftDeleteSchema', () => {
  it('defaults column to deleted_at', () => {
    const result = deleteSoftDeleteSchema.parse({});
    expect(result.column).toBe('deleted_at');
  });

  it('accepts custom column', () => {
    const result = deleteSoftDeleteSchema.parse({ column: 'is_deleted' });
    expect(result.column).toBe('is_deleted');
  });

  it('accepts explicit value', () => {
    const result = deleteSoftDeleteSchema.parse({ value: 1 });
    expect(result.value).toBe(1);
  });
});

describe('deleteBatchOperationSchema', () => {
  it('accepts valid operation with where', () => {
    const result = deleteBatchOperationSchema.safeParse({
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts operation with allowFullTableDelete', () => {
    const result = deleteBatchOperationSchema.safeParse({
      allowFullTableDelete: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects operation without where and allowFullTableDelete=false', () => {
    const result = deleteBatchOperationSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('WHERE conditions are required');
    }
  });

  it('accepts operation with cascade and softDelete', () => {
    const result = deleteBatchOperationSchema.safeParse({
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      cascade: true,
      softDelete: { column: 'deleted_at' },
    });
    expect(result.success).toBe(true);
  });
});

describe('deleteBatchOptionsSchema', () => {
  it('applies defaults', () => {
    const result = deleteBatchOptionsSchema.parse({});
    expect(result.enabled).toBe(true);
    expect(result.batchSize).toBe(100);
    expect(result.continueOnError).toBe(true);
    expect(result.maxRetries).toBe(0);
    expect(result.retryDelayMs).toBe(0);
    expect(result.benchmark).toBe(false);
  });

  it('rejects batchSize > 5000', () => {
    const result = deleteBatchOptionsSchema.safeParse({ batchSize: 10000 });
    expect(result.success).toBe(false);
  });

  it('rejects negative retryDelayMs', () => {
    const result = deleteBatchOptionsSchema.safeParse({ retryDelayMs: -1 });
    expect(result.success).toBe(false);
  });
});

describe('relationalDeleteSchema', () => {
  it('accepts valid single delete with where', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts delete with allowFullTableDelete', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      allowFullTableDelete: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects single delete without where and allowFullTableDelete=false', () => {
    const result = relationalDeleteSchema.safeParse(baseValid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('WHERE conditions are required'))).toBe(true);
    }
  });

  it('rejects operations[] with where', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      operations: [{ where: [{ column: 'id', operator: 'eq', value: 1 }] }],
      where: [{ column: 'x', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('where cannot be provided when operations[]'))).toBe(true);
    }
  });

  it('rejects operations[] with allowFullTableDelete', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      operations: [{ where: [{ column: 'id', operator: 'eq', value: 1 }] }],
      allowFullTableDelete: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('allowFullTableDelete cannot be provided'))).toBe(true);
    }
  });

  it('rejects operations[] with cascade', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      operations: [{ where: [{ column: 'id', operator: 'eq', value: 1 }] }],
      cascade: true,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('cascade cannot be provided'))).toBe(true);
    }
  });

  it('rejects operations[] with softDelete', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      operations: [{ where: [{ column: 'id', operator: 'eq', value: 1 }] }],
      softDelete: { column: 'deleted_at' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('softDelete cannot be provided'))).toBe(true);
    }
  });

  it('accepts valid batch operations', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      operations: [
        { where: [{ column: 'id', operator: 'eq', value: 1 }] },
        { where: [{ column: 'id', operator: 'eq', value: 2 }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid table name', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      table: 'DROP TABLE; --',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty connection string', () => {
    const result = relationalDeleteSchema.safeParse({
      table: 'users',
      vendor: 'postgresql',
      connectionString: '',
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts softDelete options in single mode', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      softDelete: { column: 'deleted_at', value: 'now' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts cascade in single mode', () => {
    const result = relationalDeleteSchema.safeParse({
      ...baseValid,
      where: [{ column: 'id', operator: 'eq', value: 1 }],
      cascade: true,
    });
    expect(result.success).toBe(true);
  });
});
