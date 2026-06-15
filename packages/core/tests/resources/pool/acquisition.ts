import { createConnectionPool } from '../../../src/resources/index.js';
import { describe, expect, it } from 'vitest';
import { createMockPool } from './shared.js';

describe('ConnectionPool acquisition flow', () => {
  it('reuses released connections for pending acquires and keeps stats in sync', async () => {
    const { pool } = await createMockPool({
      pool: { max: 1, acquireTimeout: 100 },
    });

    try {
      const first = await pool.acquire();
      const secondPromise = pool.acquire();
      await Promise.resolve();

      expect(pool.getStats()).toMatchObject({
        size: 1,
        available: 0,
        pending: 1,
        acquired: 1,
      });

      await pool.release(first);
      const second = await secondPromise;

      expect(second).toBe(first);
      expect(pool.getStats()).toMatchObject({
        size: 1,
        available: 0,
        pending: 0,
        acquired: 1,
      });

      await pool.release(second);
    } finally {
      await pool.clear();
    }
  });

  it('does not exceed max when concurrent acquires race while creating a connection', async () => {
    let resolveFactory: ((connection: { id: number }) => void) | undefined;
    const created: Array<{ id: number }> = [];
    let nextId = 1;
    const pool = createConnectionPool({
      factory: async () =>
        new Promise<{ id: number }>((resolve) => {
          resolveFactory = (connection) => {
            created.push(connection);
            resolve(connection);
          };
        }),
      pool: { max: 1, acquireTimeout: 100 },
    });

    try {
      const firstPromise = pool.acquire();
      const secondPromise = pool.acquire();
      await Promise.resolve();

      expect(resolveFactory).toBeDefined();
      resolveFactory!({ id: nextId++ });

      const first = await firstPromise;
      await Promise.resolve();

      expect(created).toHaveLength(1);
      expect(pool.getStats()).toMatchObject({
        size: 1,
        available: 0,
        pending: 1,
        acquired: 1,
      });

      await pool.release(first);
      const second = await secondPromise;
      expect(second).toBe(first);
    } finally {
      await pool.clear();
    }
  });
});
