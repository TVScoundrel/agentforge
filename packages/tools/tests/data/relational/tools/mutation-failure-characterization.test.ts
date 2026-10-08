import { describe, expect, it, vi } from 'vitest';
import { executeInsert } from '../../../../src/data/relational/tools/relational-insert/executor.js';
import { executeUpdate } from '../../../../src/data/relational/tools/relational-update/executor.js';
import { executeDelete } from '../../../../src/data/relational/tools/relational-delete/executor.js';
import { invokeRelationalInsert } from '../../../../src/data/relational/tools/relational-insert/index.js';
import { invokeRelationalUpdate } from '../../../../src/data/relational/tools/relational-update/index.js';
import { invokeRelationalDelete } from '../../../../src/data/relational/tools/relational-delete/index.js';
import type { SqlExecutor } from '../../../../src/data/relational/query/types.js';

const insert = { table: 'users', data: { name: 'Alice' } };
const update = { ...insert, where: [{ column: 'id', operator: 'eq' as const, value: 1 }] };
const deletion = { table: 'users', where: update.where };
const cases = [
  {
    operation: 'INSERT',
    constraint: 'Insert failed: foreign key constraint violation.',
    execute: (executor: SqlExecutor) =>
      executeInsert(executor, { ...insert, vendor: 'postgresql' }),
    invoke: (executor: SqlExecutor) =>
      invokeRelationalInsert({ executor, vendor: 'postgresql' }, insert),
    shape: { success: false, rowCount: 0, insertedIds: [], rows: [] },
  },
  {
    operation: 'UPDATE',
    constraint: 'Update failed: foreign key constraint violation.',
    execute: (executor: SqlExecutor) =>
      executeUpdate(executor, { ...update, vendor: 'postgresql' }),
    invoke: (executor: SqlExecutor) =>
      invokeRelationalUpdate({ executor, vendor: 'postgresql' }, update),
    shape: { success: false, rowCount: 0 },
  },
  {
    operation: 'DELETE',
    constraint: 'Delete failed: foreign key constraint violation.',
    execute: (executor: SqlExecutor) =>
      executeDelete(executor, { ...deletion, vendor: 'postgresql' }),
    invoke: (executor: SqlExecutor) =>
      invokeRelationalDelete({ executor, vendor: 'postgresql' }, deletion),
    shape: { success: false, rowCount: 0, softDeleted: false },
  },
];

describe.each(cases)('$operation failure outcomes before policy consolidation', (mutation) => {
  it('preserves validation Error identity', async () => {
    const error = new Error('Table name must not be empty');
    await expect(mutation.execute({ execute: vi.fn().mockRejectedValue(error) })).rejects.toBe(
      error
    );
  });

  it('prioritizes a direct-cause constraint over outer validation and preserves the cause', async () => {
    const error = new Error('Table name must not be empty', {
      cause: new Error('FOREIGN KEY constraint failed: secret_table'),
    });
    await expect(
      mutation.execute({ execute: vi.fn().mockRejectedValue(error) })
    ).rejects.toMatchObject({
      message: mutation.constraint,
      cause: error,
    });
  });

  it.each([
    new Error('TABLE NAME MUST NOT BE EMPTY'),
    new Error('driver wrapper', { cause: new Error('Table name must not be empty') }),
    new Error('driver wrapper', {
      cause: new Error('wrapper', { cause: new Error('foreign key constraint') }),
    }),
    new Error('driver wrapper', { cause: { message: 'foreign key constraint' } }),
    { message: 'foreign key constraint' },
    'foreign key constraint',
    null,
  ])('keeps opaque failures and original causes (%#)', async (error) => {
    await expect(
      mutation.execute({ execute: vi.fn().mockRejectedValue(error) })
    ).rejects.toMatchObject({
      message: `${mutation.operation} query failed. See logs for details.`,
      cause: error,
    });
  });

  it('retains the exact safe Tool response shape', async () => {
    const result = await mutation.invoke({
      execute: vi.fn().mockRejectedValue(new Error('foreign key constraint')),
    });
    expect(result).toEqual({ ...mutation.shape, error: mutation.constraint });
  });

  it('retains the exact opaque Tool response shape', async () => {
    const result = await mutation.invoke({
      execute: vi.fn().mockRejectedValue(new Error('secret driver failure')),
    });
    expect(result).toEqual({
      ...mutation.shape,
      error: `Failed to execute ${mutation.operation} query. Please verify your input and database connection.`,
    });
  });
});

it('keeps DELETE cascade guidance in the Tool response', async () => {
  const error = new Error('foreign key mismatch');
  const result = await invokeRelationalDelete(
    { executor: { execute: vi.fn().mockRejectedValue(error) }, vendor: 'postgresql' },
    { ...deletion, cascade: true }
  );
  expect(result).toEqual({
    success: false,
    rowCount: 0,
    softDeleted: false,
    error:
      'Delete failed: foreign key constraint violation. Verify database-level ON DELETE CASCADE is configured for related foreign keys.',
  });
});

it.each(['UPDATE', 'DELETE'] as const)(
  '%s retains raw batch failure text and continues',
  async (operation) => {
    const executor = {
      execute: vi
        .fn()
        .mockRejectedValueOnce(new Error('duplicate key: secret_database_detail'))
        .mockRejectedValueOnce({ message: 'foreign key constraint' })
        .mockResolvedValue({ rowCount: 1 }),
    };
    const batch = { enabled: true, continueOnError: true, batchSize: 3 };
    const result =
      operation === 'UPDATE'
        ? await invokeRelationalUpdate(
            { executor, vendor: 'postgresql' },
            { table: 'users', operations: [update, update, update], batch }
          )
        : await invokeRelationalDelete(
            { executor, vendor: 'postgresql' },
            { table: 'users', operations: [deletion, deletion, deletion], batch }
          );
    expect(result).toMatchObject({
      success: true,
      rowCount: 1,
      batch: {
        successfulItems: 1,
        failedItems: 2,
        partialSuccess: true,
        failures: [
          { error: 'duplicate key: secret_database_detail', attempts: 1 },
          { error: '[object Object]', attempts: 1 },
        ],
      },
    });
  }
);
