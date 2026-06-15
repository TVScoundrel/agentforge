import { evictIdleConnections } from '../../../src/resources/pool-eviction.js';
import { createConnectionPool } from '../../../src/resources/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPool } from './shared.js';

describe('ConnectionPool eviction flow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retains the configured minimum number of idle connections during eviction', async () => {
    vi.useFakeTimers();

    const { pool, destroyed } = await createMockPool({
      pool: {
        min: 1,
        max: 3,
        idleTimeout: 10,
        evictionInterval: 10,
      },
    });

    try {
      const first = await pool.acquire();
      const second = await pool.acquire();
      const third = await pool.acquire();

      await pool.release(first);
      await pool.release(second);
      await pool.release(third);

      await vi.advanceTimersByTimeAsync(25);

      expect(pool.getStats()).toMatchObject({
        size: 1,
        available: 1,
        acquired: 0,
      });
      expect(destroyed).toHaveLength(2);
    } finally {
      await pool.clear();
    }
  });

  it('does not evict a connection that becomes in use while eviction is in flight', async () => {
    let releaseDestroyer: (() => void) | undefined;
    const destroyed: Array<{ id: number }> = [];
    let nextId = 1;

    vi.useFakeTimers();

    const pool = createConnectionPool({
      factory: async () => ({ id: nextId++ }),
      destroyer: async (connection: { id: number }) => {
        destroyed.push(connection);
        if (destroyed.length === 1) {
          await new Promise<void>((resolve) => {
            releaseDestroyer = resolve;
          });
        }
      },
      pool: {
        min: 1,
        max: 3,
        idleTimeout: 10,
        evictionInterval: 1_000,
      },
    });

    try {
      const first = await pool.acquire();
      const second = await pool.acquire();
      const third = await pool.acquire();

      await pool.release(first);
      await pool.release(second);
      await pool.release(third);

      vi.advanceTimersByTime(11);
      const evictionTick = evictIdleConnections(
        (pool as unknown as { runtime: Parameters<typeof evictIdleConnections<{ id: number }>>[0] }).runtime
      );
      await Promise.resolve();

      const reacquired = await pool.acquire();
      expect(reacquired.id).toBe(2);

      releaseDestroyer?.();
      await evictionTick;

      expect(pool.getStats()).toMatchObject({
        size: 2,
        available: 1,
        acquired: 1,
      });
      expect(destroyed).toHaveLength(1);
      expect(destroyed[0]?.id).toBe(1);

      await pool.release(reacquired);
    } finally {
      releaseDestroyer?.();
      await pool.clear();
    }
  });
});
