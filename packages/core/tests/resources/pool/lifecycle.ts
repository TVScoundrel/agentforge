import { performHealthChecks } from '../../../src/resources/pool-health.js';
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

    try {
      const first = await pool.acquire();
      const pendingAcquire = pool.acquire();
      await Promise.resolve();

      const drainPromise = pool.drain();

      await expect(pendingAcquire).rejects.toThrow('Pool is draining');

      await pool.release(first);
      await drainPromise;

      await expect(pool.acquire()).rejects.toThrow('Pool is draining');
    } finally {
      await pool.clear();
    }
  });

  it('rejects pending acquires immediately when the pool is cleared', async () => {
    const { pool } = await createMockPool({
      pool: { max: 1, acquireTimeout: 100 },
    });

    try {
      const first = await pool.acquire();
      const pendingAcquire = pool.acquire();
      await Promise.resolve();

      await pool.clear();
      await expect(pendingAcquire).rejects.toThrow('Pool is draining');

      await expect(pool.acquire()).rejects.toThrow('Pool is draining');
      await expect(pool.release(first)).rejects.toThrow('Connection not found in pool');
    } finally {
      await pool.clear();
    }
  });

  it('does not destroy a connection that becomes in use during a failing health check', async () => {
    let resumeValidator: (() => void) | undefined;
    const { pool, destroyed } = await createMockPool({
      pool: { min: 1, max: 1 },
      validator: async () => {
        await new Promise<void>((resolve) => {
          resumeValidator = resolve;
        });
        return false;
      },
    });

    try {
      const runtime = (pool as unknown as {
        runtime: {
          connections: Array<{
            connection: { id: number };
            inUse: boolean;
          }>;
          stats: {
            available: number;
            acquired: number;
          };
        };
      }).runtime;
      const pooled = runtime.connections[0];
      if (!pooled) {
        throw new Error('Expected initialized pooled connection');
      }

      const healthCheckPromise = performHealthChecks(
        (pool as unknown as { runtime: Parameters<typeof performHealthChecks<{ id: number }>>[0] }).runtime
      );
      await Promise.resolve();

      pooled.inUse = true;
      runtime.stats.available--;
      runtime.stats.acquired++;
      resumeValidator?.();

      await healthCheckPromise;

      expect(destroyed).toHaveLength(0);
      expect(pool.getStats()).toMatchObject({
        size: 1,
        available: 0,
        acquired: 1,
      });
    } finally {
      resumeValidator?.();
      await pool.clear();
    }
  });
});
