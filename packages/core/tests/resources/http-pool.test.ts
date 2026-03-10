import { afterEach, describe, expect, it } from 'vitest';
import { createHttpPool, HttpPool } from '../../src/resources/http-pool.js';

describe('HttpPool', () => {
  const pools: HttpPool[] = [];

  afterEach(async () => {
    for (const pool of pools) {
      await pool.clear();
    }
    pools.length = 0;
  });

  it('executes requests through pooled clients', async () => {
    const pool = createHttpPool({
      config: { baseURL: 'https://example.com' },
      pool: { max: 2 },
    });
    pools.push(pool);

    const response = await pool.request<{ ok: boolean }>({
      url: '/health',
      method: 'GET',
    });

    expect(response.status).toBe(200);
    expect(response.statusText).toBe('OK');
    expect(response.data).toEqual({});
  });

  it('tracks acquire and release pool metrics', async () => {
    const pool = createHttpPool({
      config: { baseURL: 'https://example.com' },
      pool: { max: 1 },
    });
    pools.push(pool);

    const client = await pool.acquire();
    const acquiredStats = pool.getStats();
    expect(acquiredStats.acquired).toBe(1);

    await pool.release(client);
    const releasedStats = pool.getStats();
    expect(releasedStats.acquired).toBe(0);
    expect(releasedStats.available).toBeGreaterThanOrEqual(1);
  });

  it('rejects new acquires after draining', async () => {
    const pool = createHttpPool({
      config: { baseURL: 'https://example.com' },
      pool: { max: 1 },
    });
    pools.push(pool);

    await pool.drain();
    await expect(pool.acquire()).rejects.toThrow('Pool is draining');
  });
});
