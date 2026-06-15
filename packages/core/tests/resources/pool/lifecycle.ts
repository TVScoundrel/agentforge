import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMockPool } from './shared.js';

describe('ConnectionPool lifecycle flow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects pending and future acquires once draining starts', async () => {
    const { pool } = await createMockPool({
      pool: { max: 1, acquireTimeout: 100 },
    });

    const first = await pool.acquire();
    const pendingAcquire = pool.acquire();
    await Promise.resolve();

    const drainPromise = pool.drain();

    await expect(pendingAcquire).rejects.toThrow('Pool is draining');

    await pool.release(first);
    await drainPromise;

    await expect(pool.acquire()).rejects.toThrow('Pool is draining');

    await pool.clear();
  });
});
