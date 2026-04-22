import { describe, expect, it, vi, beforeEach } from 'vitest';
import { sql } from 'drizzle-orm';

const mockPgSessionExecute = vi.fn();
const mockPgDrizzle = vi.fn(() => ({
  execute: mockPgSessionExecute,
}));
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockPgDrizzle,
}));

const mockMysqlSessionExecute = vi.fn();
const mockMysqlDrizzle = vi.fn(() => ({
  execute: mockMysqlSessionExecute,
}));
vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: mockMysqlDrizzle,
}));

import {
  executeQuery,
  normalizeMySqlResult,
} from '../../../../src/data/relational/connection/query-execution.js';
import { executeInDedicatedConnection } from '../../../../src/data/relational/connection/session-adapters.js';

describe('connection query/session extraction helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('normalizes mysql tuple results to rows', async () => {
      const result = await executeQuery(
        {
          vendor: 'mysql',
          db: {
            execute: vi.fn().mockResolvedValue([[{ id: 1 }], ['fields']]),
          },
          isSqliteNonQueryError: () => false,
        },
        sql`SELECT 1`,
        { debug: vi.fn() }
      );

      expect(result).toEqual([{ id: 1 }]);
    });

    it('normalizes sqlite non-query run results to affectedRows', async () => {
      const sqliteError = new Error('This statement does not return data');
      sqliteError.name = 'SqliteError';

      const result = await executeQuery(
        {
          vendor: 'sqlite',
          db: {
            all: vi.fn().mockImplementation(() => {
              throw sqliteError;
            }),
            run: vi.fn().mockReturnValue({ changes: 2, lastInsertRowid: 5 }),
          },
          isSqliteNonQueryError: (error) => error === sqliteError,
        },
        sql`UPDATE test SET name = 'x'`,
        { debug: vi.fn() }
      );

      expect(result).toEqual({
        changes: 2,
        lastInsertRowid: 5,
        affectedRows: 2,
      });
    });
  });

  describe('executeInDedicatedConnection', () => {
    it('uses a dedicated postgresql session and releases it', async () => {
      const release = vi.fn();
      const connect = vi.fn().mockResolvedValue({ release });
      mockPgSessionExecute.mockResolvedValue([{ ok: true }]);

      const result = await executeInDedicatedConnection(
        {
          vendor: 'postgresql',
          client: { connect },
          db: {},
          isSqliteNonQueryError: () => false,
        },
        async (execute) => execute(sql`SELECT 1`)
      );

      expect(connect).toHaveBeenCalledTimes(1);
      expect(mockPgDrizzle).toHaveBeenCalledTimes(1);
      expect(mockPgSessionExecute).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ ok: true }]);
    });

    it('uses a dedicated mysql session, unwraps rows, and releases it', async () => {
      const release = vi.fn();
      const getConnection = vi.fn().mockResolvedValue({ release });
      mockMysqlSessionExecute.mockResolvedValue([[{ ok: true }], ['fields']]);

      const result = await executeInDedicatedConnection(
        {
          vendor: 'mysql',
          client: { getConnection },
          db: {},
          isSqliteNonQueryError: () => false,
        },
        async (execute) => execute(sql`SELECT 1`)
      );

      expect(getConnection).toHaveBeenCalledTimes(1);
      expect(mockMysqlDrizzle).toHaveBeenCalledTimes(1);
      expect(mockMysqlSessionExecute).toHaveBeenCalledTimes(1);
      expect(release).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ ok: true }]);
    });

    it('reuses the sqlite adapter directly for dedicated execution', async () => {
      const result = await executeInDedicatedConnection(
        {
          vendor: 'sqlite',
          client: {},
          db: {
            all: vi.fn().mockReturnValue([{ ok: true }]),
            run: vi.fn(),
          },
          isSqliteNonQueryError: () => false,
        },
        async (execute) => execute(sql`SELECT 1`)
      );

      expect(result).toEqual([{ ok: true }]);
    });
  });

  describe('normalizeMySqlResult', () => {
    it('returns non-tuple mysql results unchanged', () => {
      expect(normalizeMySqlResult({ affectedRows: 1 })).toEqual({ affectedRows: 1 });
    });
  });
});
