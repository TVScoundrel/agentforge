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

  it('does not exceed max while min-size initialization is still creating connections', async () => {
    let releaseInitialConnection: (() => void) | undefined;
    let createdCount = 0;
    let nextId = 1;

    const pool = createConnectionPool({
      factory: async () => {
        createdCount++;
        const connection = { id: nextId++ };
        if (createdCount === 1) {
          await new Promise<void>((resolve) => {
            releaseInitialConnection = resolve;
          });
        }
        return connection;
      },
      pool: { min: 1, max: 1, acquireTimeout: 50 },
    });

    try {
      await Promise.resolve();
      const pendingAcquire = pool.acquire();
      await Promise.resolve();

      expect(pool.getStats()).toMatchObject({
        size: 0,
        pending: 1,
        acquired: 0,
      });
      expect(createdCount).toBe(1);

      releaseInitialConnection?.();
      const acquired = await pendingAcquire;

      expect(acquired.id).toBe(1);
      expect(pool.getStats()).toMatchObject({
        size: 1,
        pending: 0,
        acquired: 1,
      });
    } finally {
      releaseInitialConnection?.();
      await pool.clear();
    }
  });

  it('rejects an acquire whose connection finishes creating after the pool starts clearing', async () => {
    let resolveFactory: ((connection: { id: number }) => void) | undefined;
    const destroyed: Array<{ id: number }> = [];
    const pool = createConnectionPool({
      factory: async () =>
        new Promise<{ id: number }>((resolve) => {
          resolveFactory = resolve;
        }),
      destroyer: async (connection) => {
        destroyed.push(connection);
      },
      pool: { max: 1, acquireTimeout: 100 },
    });

    try {
      const pendingAcquire = pool.acquire();
      await Promise.resolve();

      const clearPromise = pool.clear();
      resolveFactory?.({ id: 1 });

      await expect(pendingAcquire).rejects.toThrow('Pool is draining');
      await clearPromise;

      expect(destroyed).toEqual([{ id: 1 }]);
      expect(pool.getStats()).toMatchObject({
        size: 0,
        available: 0,
        acquired: 0,
        destroyed: 1,
      });
    } finally {
      await pool.clear();
    }
  });
});
