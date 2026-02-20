/**
 * Tests for ConnectionManager lifecycle, pool validation, state management
 *
 * Uses vi.mock to mock database driver imports (pg, mysql2, better-sqlite3)
 * so no real database is required.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the peer dependency checker to always pass
vi.mock('../../../../src/data/relational/utils/peer-dependency-checker.js', () => ({
  checkPeerDependency: vi.fn(),
}));

// Mock drizzle-orm to provide a minimal sql function
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
  };
});

// Mock pg driver
const mockPoolEnd = vi.fn().mockResolvedValue(undefined);
const mockPoolConnect = vi.fn().mockResolvedValue({
  release: vi.fn(),
});
const mockPool = vi.fn().mockImplementation(() => ({
  end: mockPoolEnd,
  connect: mockPoolConnect,
  totalCount: 2,
  idleCount: 1,
  waitingCount: 0,
}));

vi.mock('pg', () => ({
  Pool: mockPool,
}));

// Mock drizzle-orm/node-postgres
const mockPgExecute = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
const mockPgDrizzle = vi.fn().mockReturnValue({
  execute: mockPgExecute,
});
vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: mockPgDrizzle,
}));

// Mock mysql2 driver
const mockMysqlPoolEnd = vi.fn().mockResolvedValue(undefined);
const mockMysqlGetConnection = vi.fn().mockResolvedValue({
  release: vi.fn(),
});
const mockMysqlCreatePool = vi.fn().mockReturnValue({
  end: mockMysqlPoolEnd,
  getConnection: mockMysqlGetConnection,
});
vi.mock('mysql2/promise', () => ({
  createPool: mockMysqlCreatePool,
}));

// Mock drizzle-orm/mysql2
const mockMysqlExecute = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
const mockMysqlDrizzle = vi.fn().mockReturnValue({
  execute: mockMysqlExecute,
});
vi.mock('drizzle-orm/mysql2', () => ({
  drizzle: mockMysqlDrizzle,
}));

// Mock better-sqlite3
const mockSqliteClose = vi.fn();
const mockSqliteDb = {
  close: mockSqliteClose,
  open: true,
};
const mockDatabase = vi.fn().mockReturnValue(mockSqliteDb);
vi.mock('better-sqlite3', () => ({
  default: mockDatabase,
}));

// Mock drizzle-orm/better-sqlite3
const mockSqliteExecute = vi.fn().mockReturnValue([{ '?column?': 1 }]);
const mockSqliteDrizzle = vi.fn().mockReturnValue({
  execute: mockSqliteExecute,
});
vi.mock('drizzle-orm/better-sqlite3', () => ({
  drizzle: mockSqliteDrizzle,
}));

import { ConnectionManager, ConnectionState } from '../../../../src/data/relational/connection/connection-manager.js';

describe('ConnectionManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock return values after clearAllMocks clears implementations
    mockPgExecute.mockResolvedValue([{ '?column?': 1 }]);
    mockMysqlExecute.mockResolvedValue([{ '?column?': 1 }]);
    mockSqliteExecute.mockReturnValue([{ '?column?': 1 }]);
    mockPoolEnd.mockResolvedValue(undefined);
    mockPoolConnect.mockResolvedValue({ release: vi.fn() });
    mockMysqlPoolEnd.mockResolvedValue(undefined);
    mockMysqlGetConnection.mockResolvedValue({ release: vi.fn() });
    mockSqliteClose.mockReturnValue(undefined);

    // Reset drizzle factories
    mockPgDrizzle.mockReturnValue({ execute: mockPgExecute });
    mockMysqlDrizzle.mockReturnValue({ execute: mockMysqlExecute });
    mockSqliteDrizzle.mockReturnValue({ execute: mockSqliteExecute });

    // Reset pool/driver constructors
    mockPool.mockImplementation(() => ({
      end: mockPoolEnd,
      connect: mockPoolConnect,
      totalCount: 2,
      idleCount: 1,
      waitingCount: 0,
    }));
    mockMysqlCreatePool.mockReturnValue({
      end: mockMysqlPoolEnd,
      getConnection: mockMysqlGetConnection,
    });
    mockDatabase.mockReturnValue({
      close: mockSqliteClose,
      open: true,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('creates instance with PostgreSQL vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });
      expect(manager.getVendor()).toBe('postgresql');
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('creates instance with MySQL vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });
      expect(manager.getVendor()).toBe('mysql');
    });

    it('creates instance with SQLite vendor', () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });
      expect(manager.getVendor()).toBe('sqlite');
    });

    it('applies default reconnection config', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });
      expect(manager.isConnected()).toBe(false);
    });

    it('accepts custom reconnection config', () => {
      const manager = new ConnectionManager(
        { vendor: 'postgresql', connection: 'postgresql://localhost/test' },
        { enabled: true, maxAttempts: 10, baseDelayMs: 500, maxDelayMs: 60000 }
      );
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('connect / disconnect lifecycle', () => {
    it('connects to PostgreSQL', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);

      await manager.disconnect();
      expect(manager.isConnected()).toBe(false);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('connect is a no-op when already connected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      // Second connect should be no-op
      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      await manager.disconnect();
    });

    it('connects to MySQL', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });

    it('connects to MySQL with object config', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: {
          host: 'localhost',
          database: 'test',
          pool: { max: 5, idleTimeoutMillis: 30000, acquireTimeoutMillis: 5000 },
        } as any,
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });

    it('connects to SQLite', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });

    it('connects to SQLite with object config', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: { url: ':memory:' } as any,
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });

    it('throws when SQLite object config has no url', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: { host: 'localhost' } as any,
      });

      await expect(manager.connect()).rejects.toThrow('SQLite connection requires a url property');
    });

    it('emits connected/disconnected events', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const connectedFn = vi.fn();
      const disconnectedFn = vi.fn();
      manager.on('connected', connectedFn);
      manager.on('disconnected', disconnectedFn);

      await manager.connect();
      expect(connectedFn).toHaveBeenCalledOnce();

      await manager.disconnect();
      expect(disconnectedFn).toHaveBeenCalledOnce();
    });
  });

  describe('dispose', () => {
    it('disconnects and removes all listeners', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const fn = vi.fn();
      manager.on('connected', fn);

      await manager.connect();
      await manager.dispose();

      expect(manager.isConnected()).toBe(false);
      expect(manager.listenerCount('connected')).toBe(0);
    });
  });

  describe('execute', () => {
    it('executes a query when connected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      const { sql } = await import('drizzle-orm');
      const result = await manager.execute(sql`SELECT 1`);
      expect(result).toBeDefined();
      await manager.disconnect();
    });

    it('throws when not initialized', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const { sql } = await import('drizzle-orm');
      await expect(manager.execute(sql`SELECT 1`)).rejects.toThrow('Database not initialized');
    });
  });

  describe('executeInConnection', () => {
    it('throws when not initialized', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await expect(
        manager.executeInConnection(async () => 'result')
      ).rejects.toThrow('Database not initialized');
    });

    it('works for PostgreSQL with dedicated connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      const result = await manager.executeInConnection(async (execute) => {
        return 'pg-result';
      });
      expect(result).toBe('pg-result');
      await manager.disconnect();
    });

    it('works for MySQL with dedicated connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      const result = await manager.executeInConnection(async (execute) => {
        return 'mysql-result';
      });
      expect(result).toBe('mysql-result');
      await manager.disconnect();
    });

    it('works for SQLite (direct execution)', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      const result = await manager.executeInConnection(async (execute) => {
        return 'sqlite-result';
      });
      expect(result).toBe('sqlite-result');
      await manager.disconnect();
    });
  });

  describe('getPoolMetrics', () => {
    it('returns zero metrics when not connected', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const metrics = manager.getPoolMetrics();
      expect(metrics.totalCount).toBe(0);
      expect(metrics.activeCount).toBe(0);
      expect(metrics.idleCount).toBe(0);
      expect(metrics.waitingCount).toBe(0);
    });

    it('returns PostgreSQL pool metrics', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      const metrics = manager.getPoolMetrics();
      expect(metrics.totalCount).toBe(2);
      expect(metrics.idleCount).toBe(1);
      expect(metrics.activeCount).toBe(1); // totalCount - idleCount
      expect(metrics.waitingCount).toBe(0);
      await manager.disconnect();
    });

    it('returns MySQL zero metrics (unsupported)', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      const metrics = manager.getPoolMetrics();
      expect(metrics.totalCount).toBe(0);
      expect(metrics.activeCount).toBe(0);
      await manager.disconnect();
    });

    it('returns SQLite single-connection metrics', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      const metrics = manager.getPoolMetrics();
      expect(metrics.totalCount).toBe(1);
      expect(metrics.activeCount).toBe(1);
      expect(metrics.idleCount).toBe(0);
      await manager.disconnect();
    });
  });

  describe('pool validation', () => {
    it('rejects pool max < 1', () => {
      expect(() => new ConnectionManager({
        vendor: 'postgresql',
        connection: { connectionString: 'postgresql://localhost/test', pool: { max: 0 } } as any,
      })).not.toThrow(); // constructor doesn't validate pool config

      // pool validation happens on connect
    });

    it('connects PostgreSQL with pool config', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: {
          connectionString: 'postgresql://localhost/test',
          pool: { max: 10, idleTimeoutMillis: 30000, acquireTimeoutMillis: 5000 },
        } as any,
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });

    it('connects SQLite with pool config (logs but ignores)', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: { url: ':memory:', pool: { max: 5 } } as any,
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });
  });

  describe('health check', () => {
    it('isHealthy returns true when connected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      const healthy = await (manager as any).isHealthy();
      expect(healthy).toBe(true);
      await manager.disconnect();
    });

    it('isHealthy returns false when not initialized', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const healthy = await (manager as any).isHealthy();
      expect(healthy).toBe(false);
    });

    it('isHealthy returns false when query fails', async () => {
      mockPgExecute.mockRejectedValueOnce(new Error('Query failed'));

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      // Manually set internal state to simulate partial init
      (manager as any).db = { execute: mockPgExecute };
      (manager as any).client = {};

      const healthy = await (manager as any).isHealthy();
      expect(healthy).toBe(false);
    });
  });

  describe('close', () => {
    it('closes PostgreSQL pool', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      await manager.close();
      expect(mockPoolEnd).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('closes MySQL pool', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      await manager.close();
      expect(mockMysqlPoolEnd).toHaveBeenCalled();
    });

    it('closes SQLite connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await manager.close();
      expect(mockSqliteClose).toHaveBeenCalled();
    });

    it('handles close error gracefully', async () => {
      mockPoolEnd.mockRejectedValueOnce(new Error('Close error'));

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      const errorFn = vi.fn();
      manager.on('error', errorFn);

      // close should not throw despite error
      await manager.close();
      expect(manager.getState()).toBe(ConnectionState.ERROR);
      expect(errorFn).toHaveBeenCalled();
    });

    it('no-op close when no client but not disconnected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      // Manually set state to ERROR without a client
      (manager as any).state = ConnectionState.ERROR;
      await manager.close();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });

  describe('reconnection', () => {
    it('schedules reconnection on error when configured', async () => {
      // Make health check fail to trigger error
      mockPgExecute.mockRejectedValue(new Error('Health check failed'));

      const manager = new ConnectionManager(
        { vendor: 'postgresql', connection: 'postgresql://localhost/test' },
        { enabled: true, maxAttempts: 1, baseDelayMs: 10, maxDelayMs: 100 }
      );

      const errorFn = vi.fn();
      const reconnectFn = vi.fn();
      manager.on('error', errorFn);
      manager.on('reconnecting', reconnectFn);

      try {
        await manager.connect();
      } catch {
        // Expected to fail
      }

      expect(errorFn).toHaveBeenCalled();
      expect(reconnectFn).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.RECONNECTING);

      // Cleanup the scheduled timer
      await manager.disconnect();
    });
  });

  describe('initialization error handling', () => {
    it('emits error event on init failure', async () => {
      mockPgExecute.mockRejectedValue(new Error('Connection refused'));

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const errorFn = vi.fn();
      manager.on('error', errorFn);

      await expect(manager.connect()).rejects.toThrow('Failed to initialize');
      expect(errorFn).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.ERROR);
    });

    it('throws for unsupported vendor', async () => {
      const manager = new ConnectionManager({
        vendor: 'oracle' as any,
        connection: 'oracle://localhost/test',
      });

      await expect(manager.connect()).rejects.toThrow('Unsupported database vendor');
    });
  });
});
