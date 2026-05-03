import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDatabasePool,
  type DatabaseConnection,
  type DatabaseQueryParams,
  type DatabasePool,
} from '../../src/resources/database-pool.js';

const databaseConfig = {
  host: 'localhost',
  database: 'agentforge',
  user: 'agentforge',
  password: 'secret',
};

describe('DatabasePool', () => {
  const pools: DatabasePool[] = [];

  afterEach(async () => {
    vi.useRealTimers();

    for (const pool of pools) {
      await pool.clear();
    }
    pools.length = 0;
  });

  it('delegates typed query parameters through pooled connections and releases the connection', async () => {
    const pool = createDatabasePool({
      config: databaseConfig,
      pool: { max: 1 },
    });
    pools.push(pool);

    const connection = await pool.acquire();
    const queryCalls: Array<{ sql: string; params?: DatabaseQueryParams }> = [];
    connection.query = async <TResult = unknown>(
      sql: string,
      params?: DatabaseQueryParams
    ): Promise<TResult> => {
      queryCalls.push({ sql, params });
      return [{ id: 1, name: 'Ada' }] as TResult;
    };
    await pool.release(connection);

    const params = ['active', 10] as const;
    const result = await pool.query<Array<{ id: number; name: string }>>(
      'SELECT * FROM users WHERE status = ? LIMIT ?',
      params
    );

    expect(result).toEqual([{ id: 1, name: 'Ada' }]);
    expect(queryCalls).toEqual([
      {
        sql: 'SELECT * FROM users WHERE status = ? LIMIT ?',
        params,
      },
    ]);
    expect(pool.getStats().acquired).toBe(0);
  });

  it('releases connections when execute delegation fails', async () => {
    const pool = createDatabasePool({
      config: databaseConfig,
      pool: { max: 1 },
    });
    pools.push(pool);

    const connection = await pool.acquire();
    const executeCalls: Array<{ sql: string; params?: DatabaseQueryParams }> = [];
    connection.execute = async (sql: string, params?: DatabaseQueryParams): Promise<void> => {
      executeCalls.push({ sql, params });
      throw new Error('execute failed');
    };
    await pool.release(connection);

    const params = ['Ada'] as const;
    await expect(pool.execute('DELETE FROM users WHERE name = ?', params)).rejects.toThrow('execute failed');

    expect(executeCalls).toEqual([
      {
        sql: 'DELETE FROM users WHERE name = ?',
        params,
      },
    ]);
    expect(pool.getStats().acquired).toBe(0);
  });

  it('runs health-check validation through the typed query contract', async () => {
    vi.useFakeTimers();

    const pool = createDatabasePool({
      config: databaseConfig,
      pool: { max: 1 },
      healthCheck: {
        enabled: true,
        interval: 10,
        timeout: 5,
        retries: 1,
        query: 'SELECT healthy',
      },
    });
    pools.push(pool);

    const connection = await pool.acquire();
    const query = vi.fn<DatabaseConnection['query']>(async <TResult = unknown>(
      sql: string,
      _params?: DatabaseQueryParams
    ): Promise<TResult> => {
      expect(sql).toBe('SELECT healthy');
      return [{ healthy: true }] as TResult;
    });
    connection.query = query;
    await pool.release(connection);

    await vi.advanceTimersByTimeAsync(10);

    expect(query).toHaveBeenCalledTimes(1);
    expect(pool.getStats().healthChecksPassed).toBe(1);
  });
});
