import { describe, expect, it, vi } from 'vitest';
import { createMockManager, executeInsert } from './shared.js';

describe('relational-insert > executor > error handling', () => {
  it('should wrap constraint violation errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('unique constraint violated on column "email"'),
    );

    await expect(
      executeInsert(manager, {
        table: 'users',
        data: { name: 'Dup', email: 'dup@example.com' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Insert failed: unique constraint violation.');
  });

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Table name must not be empty'),
    );

    await expect(
      executeInsert(manager, {
        table: 'users',
        data: { name: 'X' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('Table name must not be empty');
  });

  it('should sanitize unknown database errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('FATAL: connection to server lost'),
    );

    await expect(
      executeInsert(manager, {
        table: 'users',
        data: { name: 'Y' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('INSERT query failed. See logs for details.');
  });

  it('should use transaction context when provided', async () => {
    const txExecute = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const manager = createMockManager();
    const tx = { execute: txExecute };

    await executeInsert(
      manager,
      {
        table: 'users',
        data: { name: 'Tx' },
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      },
      { transaction: tx },
    );

    expect(txExecute).toHaveBeenCalledOnce();
    expect(manager.execute).not.toHaveBeenCalled();
  });
});
