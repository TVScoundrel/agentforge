/**
 * Tests for relational UPDATE schema validation (superRefine logic)
 */
import { describe, it, expect } from 'vitest';
import {
  updateWhereConditionSchema,
  updateDataSchema,
  updateBatchOperationSchema,
  relationalUpdateSchema,
  updateBatchOptionsSchema,
  updateOptimisticLockSchema,
} from '../../../../src/data/relational/tools/relational-update/schemas.js';

const baseValid = {
  table: 'users',
  vendor: 'postgresql' as const,
  connectionString: 'postgresql://localhost/test',
};

describe('updateDataSchema', () => {
  it('accepts valid object with key-value pairs', () => {
    const result = updateDataSchema.safeParse({ name: 'Alice', age: 30 });
    expect(result.success).toBe(true);
  });

  it('rejects empty object', () => {
    const result = updateDataSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Update data must not be empty');
    }
  });

  it('accepts null values', () => {
    const result = updateDataSchema.safeParse({ email: null });
    expect(result.success).toBe(true);
  });

  it('accepts boolean values', () => {
    const result = updateDataSchema.safeParse({ active: true });
    expect(result.success).toBe(true);
  });
});

describe('updateWhereConditionSchema', () => {
  it('accepts eq with value', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'id', operator: 'eq', value: 1 });
    expect(result.success).toBe(true);
  });

  it('rejects isNull with value', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'isNull', value: 'x' });
    expect(result.success).toBe(false);
  });

  it('rejects isNotNull with value', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'isNotNull', value: 1 });
    expect(result.success).toBe(false);
  });

  it('accepts isNull without value', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'isNull' });
    expect(result.success).toBe(true);
  });

  it('rejects ne without value', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'ne' });
    expect(result.success).toBe(false);
  });

  it('accepts in with array', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'id', operator: 'in', value: [1, 2] });
    expect(result.success).toBe(true);
  });

  it('rejects in with non-array', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'id', operator: 'in', value: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('IN operator requires an array');
    }
  });

  it('rejects in with empty array', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'id', operator: 'in', value: [] });
    expect(result.success).toBe(false);
  });

  it('rejects notIn with non-array', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'id', operator: 'notIn', value: 5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('NOT IN operator requires an array');
    }
  });

  it('rejects notIn with empty array', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'id', operator: 'notIn', value: [] });
    expect(result.success).toBe(false);
  });

  it('rejects eq with null', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'eq', value: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('null is only allowed with isNull/isNotNull');
    }
  });

  it('rejects like with non-string', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'like', value: 123 });
    expect(result.success).toBe(false);
  });

  it('accepts like with string', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'name', operator: 'like', value: '%test%' });
    expect(result.success).toBe(true);
  });

  it('rejects gt with boolean', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'gt', value: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('GT operator requires a string or number');
    }
  });

  it('rejects lt with boolean', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'lt', value: false });
    expect(result.success).toBe(false);
  });

  it('rejects gte with boolean', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'gte', value: true });
    expect(result.success).toBe(false);
  });

  it('rejects lte with boolean', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'c', operator: 'lte', value: false });
    expect(result.success).toBe(false);
  });

  it('accepts gt with number', () => {
    const result = updateWhereConditionSchema.safeParse({ column: 'age', operator: 'gt', value: 18 });
    expect(result.success).toBe(true);
  });
});

describe('updateOptimisticLockSchema', () => {
  it('accepts string expected value', () => {
    const result = updateOptimisticLockSchema.safeParse({ column: 'version', expectedValue: 'v1' });
    expect(result.success).toBe(true);
  });

  it('accepts numeric expected value', () => {
    const result = updateOptimisticLockSchema.safeParse({ column: 'version', expectedValue: 5 });
    expect(result.success).toBe(true);
  });

  it('rejects empty column', () => {
    const result = updateOptimisticLockSchema.safeParse({ column: '', expectedValue: 1 });
    expect(result.success).toBe(false);
  });
});

describe('updateBatchOperationSchema', () => {
  it('accepts valid operation with data and where', () => {
    const result = updateBatchOperationSchema.safeParse({
      data: { name: 'Test' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts operation with allowFullTableUpdate', () => {
    const result = updateBatchOperationSchema.safeParse({
      data: { active: false },
      allowFullTableUpdate: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts operation with optimisticLock only', () => {
    const result = updateBatchOperationSchema.safeParse({
      data: { name: 'Test' },
      optimisticLock: { column: 'version', expectedValue: 1 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects operation without where, allowFullTableUpdate, and optimisticLock', () => {
    const result = updateBatchOperationSchema.safeParse({
      data: { name: 'Test' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('WHERE conditions are required');
    }
  });
});

describe('updateBatchOptionsSchema', () => {
  it('applies defaults', () => {
    const result = updateBatchOptionsSchema.parse({});
    expect(result.enabled).toBe(true);
    expect(result.batchSize).toBe(100);
    expect(result.continueOnError).toBe(true);
    expect(result.maxRetries).toBe(0);
    expect(result.retryDelayMs).toBe(0);
    expect(result.benchmark).toBe(false);
  });

  it('rejects batchSize > 5000', () => {
    const result = updateBatchOptionsSchema.safeParse({ batchSize: 10000 });
    expect(result.success).toBe(false);
  });

  it('rejects maxRetries > 5', () => {
    const result = updateBatchOptionsSchema.safeParse({ maxRetries: 10 });
    expect(result.success).toBe(false);
  });
});

describe('relationalUpdateSchema', () => {
  it('accepts valid single update', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      data: { name: 'Alice' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects single update without data', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('data is required'))).toBe(true);
    }
  });

  it('rejects operations[] with data', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      data: { name: 'Test' },
      operations: [{
        data: { name: 'Test' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
      }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('data cannot be provided when operations[]'))).toBe(true);
    }
  });

  it('rejects operations[] with where', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      operations: [{
        data: { name: 'Test' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
      }],
      where: [{ column: 'x', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects operations[] with optimisticLock', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      operations: [{
        data: { name: 'Test' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
      }],
      optimisticLock: { column: 'version', expectedValue: 1 },
    });
    expect(result.success).toBe(false);
  });

  it('rejects operations[] with allowFullTableUpdate', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      operations: [{
        data: { name: 'Test' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
      }],
      allowFullTableUpdate: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects single update without where and allowFullTableUpdate=false', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      data: { name: 'Test' },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(i => i.message.includes('WHERE conditions are required'))).toBe(true);
    }
  });

  it('accepts single update with allowFullTableUpdate', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      data: { active: false },
      allowFullTableUpdate: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts single update with optimisticLock only', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      data: { name: 'Updated' },
      optimisticLock: { column: 'version', expectedValue: 3 },
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid batch operations', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      operations: [
        { data: { name: 'A' }, where: [{ column: 'id', operator: 'eq', value: 1 }] },
        { data: { name: 'B' }, where: [{ column: 'id', operator: 'eq', value: 2 }] },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid table name', () => {
    const result = relationalUpdateSchema.safeParse({
      ...baseValid,
      table: 'DROP TABLE; --',
      data: { name: 'Test' },
      where: [{ column: 'id', operator: 'eq', value: 1 }],
    });
    expect(result.success).toBe(false);
  });
});
