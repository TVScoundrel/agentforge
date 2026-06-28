import { describe, expect, it, vi } from 'vitest';
import { createMockManager, executeDelete } from './shared.js';

describe('relational-delete > executor > error handling', () => {
  it('should wrap constraint violation errors', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('violates foreign key constraint'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('foreign key constraint violation');
  });

  it('should rethrow safe validation errors as-is', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Table name must not be empty'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
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
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('DELETE query failed. See logs for details.');
  });

  it('should mention cascade hint in FK error when cascade is true', async () => {
    const manager = createMockManager();
    (manager.execute as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('violates foreign key constraint'),
    );

    await expect(
      executeDelete(manager, {
        table: 'users',
        where: [{ column: 'id', operator: 'eq', value: 1 }],
        cascade: true,
        vendor: 'postgresql',
        connectionString: 'postgresql://localhost/test',
      }),
    ).rejects.toThrow('foreign key');
  });
});
