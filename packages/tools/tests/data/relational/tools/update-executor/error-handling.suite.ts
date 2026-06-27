import { describe, expect, it, vi } from 'vitest';
import { createMockManager, executeUpdate } from './shared.js';

describe('relational-update > executor > error handling', () => {
  it('should throw when optimistic lock fails', async () => {
    const manager = createMockManager([{ affectedRows: 0 }]);

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { name: 'OL' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        optimisticLock: {
          column: 'version',
          expectedValue: 5,
        },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('optimistic lock check failed');
  });

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const manager = createMockManager();

    await executeUpdate(
      manager,
      {
        table: 'users',
        data: { name: 'TxUpdate' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      },
      { transaction: { execute: txExecute } },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });

  it('should throw when data is missing and no operations array', async () => {
    const manager = createMockManager();

    await expect(
      executeUpdate(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      } as never),
    ).rejects.toThrow();
  });

  it('should wrap constraint violation errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('unique constraint violated on column "email"'),
    );

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { email: 'dup@example.com' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Update failed: unique constraint violation.');
  });

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Update data must not be empty'),
    );

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { name: 'X' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Update data must not be empty');
  });

  it('should sanitize unknown database errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('FATAL: connection to server lost'),
    );

    await expect(
      executeUpdate(manager, {
        table: 'users',
        data: { name: 'Y' },
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('UPDATE query failed. See logs for details.');
  });
});
