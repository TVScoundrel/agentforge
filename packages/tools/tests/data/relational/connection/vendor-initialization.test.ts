import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPool = vi.fn();
const mockPgDrizzle = vi.fn();
const mockMysqlCreatePool = vi.fn();
const mockMysqlDrizzle = vi.fn();
const mockDatabase = vi.fn();
const mockSqliteDrizzle = vi.fn();
const mockSqlitePragma = vi.fn();

vi.mock('pg', () => ({
  Pool: mockPool,
}));

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockPgDrizzle,
}));

vi.mock('mysql2/promise', () => ({
  createPool: mockMysqlCreatePool,
}));

vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: mockMysqlDrizzle,
}));

vi.mock('better-sqlite3', () => ({
  default: mockDatabase,
}));

vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: mockSqliteDrizzle,
}));

import {
  initializeMySQLConnection,
  initializePostgreSQLConnection,
  initializeSQLiteConnection,
  initializeVendorConnection,
  validatePoolConfig,
} from '../../../../src/data/relational/connection/vendor-initialization.js';

describe('vendor-initialization helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPool.mockImplementation((config) => ({ kind: 'pg-client', config }));
    mockPgDrizzle.mockImplementation(({ client }) => ({ kind: 'pg-db', client }));

    mockMysqlCreatePool.mockImplementation((config) => ({ kind: 'mysql-client', config }));
    mockMysqlDrizzle.mockImplementation(({ client }) => ({ kind: 'mysql-db', client }));

    mockDatabase.mockImplementation((url) => ({
      kind: 'sqlite-client',
      url,
      pragma: mockSqlitePragma,
    }));
    mockSqliteDrizzle.mockImplementation(({ client }) => ({ kind: 'sqlite-db', client }));
  });

  describe('validatePoolConfig', () => {
    it('rejects invalid max connections', () => {
      expect(() => validatePoolConfig({ max: 0 })).toThrow('Pool max connections must be >= 1');
    });

    it('rejects negative acquire timeout', () => {
      expect(() => validatePoolConfig({ acquireTimeoutMillis: -1 })).toThrow(
        'Pool acquire timeout must be >= 0'
      );
    });

    it('rejects negative idle timeout', () => {
      expect(() => validatePoolConfig({ idleTimeoutMillis: -1 })).toThrow(
        'Pool idle timeout must be >= 0'
      );
    });
  });

  describe('initializePostgreSQLConnection', () => {
    it('maps pool config fields for object connections', async () => {
      const initialized = await initializePostgreSQLConnection({
        host: 'localhost',
        database: 'app',
        user: 'user',
        password: 'secret',
        pool: {
          max: 5,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 10000,
        },
      });

      expect(mockPool).toHaveBeenCalledWith({
        host: 'localhost',
        database: 'app',
        user: 'user',
        password: 'secret',
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      expect(initialized).toEqual({
        client: expect.objectContaining({ kind: 'pg-client' }),
        db: expect.objectContaining({ kind: 'pg-db' }),
      });
    });

    it('passes connection strings through as connectionString config', async () => {
      await initializePostgreSQLConnection('postgresql://localhost/test');

      expect(mockPool).toHaveBeenCalledWith({
        connectionString: 'postgresql://localhost/test',
      });
    });
  });

  describe('initializeMySQLConnection', () => {
    it('maps pool config fields for object connections', async () => {
      const initialized = await initializeMySQLConnection({
        host: 'localhost',
        database: 'app',
        user: 'user',
        password: 'secret',
        pool: {
          max: 7,
          idleTimeoutMillis: 45000,
          acquireTimeoutMillis: 8000,
        },
      });

      expect(mockMysqlCreatePool).toHaveBeenCalledWith({
        host: 'localhost',
        database: 'app',
        user: 'user',
        password: 'secret',
        connectionLimit: 7,
        acquireTimeout: 8000,
        idleTimeout: 45000,
      });
      expect(initialized).toEqual({
        client: expect.objectContaining({ kind: 'mysql-client' }),
        db: expect.objectContaining({ kind: 'mysql-db' }),
      });
    });

    it('passes connection strings directly to mysql2.createPool', async () => {
      await initializeMySQLConnection('mysql://localhost/test');
      expect(mockMysqlCreatePool).toHaveBeenCalledWith('mysql://localhost/test');
    });
  });

  describe('initializeSQLiteConnection', () => {
    it('creates a sqlite client, enables foreign keys, and wires drizzle', async () => {
      const initialized = await initializeSQLiteConnection({
        url: ':memory:',
        pool: { max: 3, idleTimeoutMillis: 2000 },
      });

      expect(mockDatabase).toHaveBeenCalledWith(':memory:');
      expect(mockSqlitePragma).toHaveBeenCalledWith('foreign_keys = ON');
      expect(initialized).toEqual({
        client: expect.objectContaining({ kind: 'sqlite-client', url: ':memory:' }),
        db: expect.objectContaining({ kind: 'sqlite-db' }),
      });
    });

    it('requires a sqlite url in object config', async () => {
      await expect(
        initializeSQLiteConnection({ pool: { max: 1 } } as never)
      ).rejects.toThrow('SQLite connection requires a url property');
    });
  });

  describe('initializeVendorConnection', () => {
    it('routes vendor initialization to the selected adapter', async () => {
      const initialized = await initializeVendorConnection({
        vendor: 'sqlite',
        connection: ':memory:',
      });
      expect(initialized.client).toEqual(expect.objectContaining({ kind: 'sqlite-client' }));
    });

    it('rejects unsupported vendors', async () => {
      await expect(
        initializeVendorConnection({
          vendor: 'oracle' as never,
          connection: 'oracle://localhost/test',
        })
      ).rejects.toThrow('Unsupported database vendor: oracle');
    });
  });
});
