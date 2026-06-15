import { describe, expect, it } from 'vitest';
import { createMockPool } from './shared.js';

describe('ConnectionPool acquisition flow', () => {
  it('reuses released connections for pending acquires and keeps stats in sync', async () => {
    const { pool } = await createMockPool({
      pool: { max: 1, acquireTimeout: 100 },
    });

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
    await pool.clear();
  });
});
