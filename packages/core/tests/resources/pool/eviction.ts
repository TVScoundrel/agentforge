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
});
