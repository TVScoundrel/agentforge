import { describe, expect, it } from 'vitest';
import {
  ConnectionManager,
  ConnectionState,
  mockMysqlPoolEnd,
  mockPgExecute,
  mockSqliteClose,
} from './connection-manager.mock-harness.js';

describe('ConnectionManager mocked operations', () => {
  describe('cross-vendor connectivity', () => {
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
        } as never,
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
        connection: { url: ':memory:' } as never,
      });

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
      await manager.disconnect();
    });

    it('throws when SQLite object config has no url', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: { host: 'localhost' } as never,
      });

      await expect(manager.connect()).rejects.toThrow('SQLite connection requires a url property');
    });
  });

  describe('query execution', () => {
    it('executes a query when connected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      const { sql } = await import('drizzle-orm');
      await expect(manager.execute(sql`SELECT 1`)).resolves.toBeDefined();
      await manager.disconnect();
    });

    it('throws when execute is called before initialization', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      const { sql } = await import('drizzle-orm');
      await expect(manager.execute(sql`SELECT 1`)).rejects.toThrow('Database not initialized');
    });

    it('throws when executeInConnection is called before initialization', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await expect(manager.executeInConnection(async () => 'result')).rejects.toThrow(
        'Database not initialized'
      );
    });

    it('executes in a dedicated PostgreSQL connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      await expect(manager.executeInConnection(async () => 'pg-result')).resolves.toBe('pg-result');
      await manager.disconnect();
    });

    it('executes in a dedicated MySQL connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      await expect(manager.executeInConnection(async () => 'mysql-result')).resolves.toBe(
        'mysql-result'
      );
      await manager.disconnect();
    });

    it('executes in SQLite without allocating a dedicated session', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await expect(manager.executeInConnection(async () => 'sqlite-result')).resolves.toBe(
        'sqlite-result'
      );
      await manager.disconnect();
    });
  });

  describe('health checks and metrics', () => {
    it('returns false for health when not initialized', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await expect(manager.isHealthy()).resolves.toBe(false);
    });

    it('returns true for health when connected', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      await expect(manager.isHealthy()).resolves.toBe(true);
      await manager.disconnect();
    });

    it('returns false for health when the probe query fails', async () => {
      mockPgExecute.mockRejectedValueOnce(new Error('Query failed'));

      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      (manager as unknown as { db: { execute: typeof mockPgExecute }; client: object }).db = {
        execute: mockPgExecute,
      };
      (manager as unknown as { client: object }).client = {};

      await expect(manager.isHealthy()).resolves.toBe(false);
    });

    it('returns zero metrics when not connected', () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 0,
        activeCount: 0,
        idleCount: 0,
        waitingCount: 0,
      });
    });

    it('returns PostgreSQL pool metrics', async () => {
      const manager = new ConnectionManager({
        vendor: 'postgresql',
        connection: 'postgresql://localhost/test',
      });

      await manager.connect();
      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 2,
        activeCount: 1,
        idleCount: 1,
        waitingCount: 0,
      });
      await manager.disconnect();
    });

    it('returns MySQL zero metrics because no stable pool API is exposed', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 0,
        activeCount: 0,
        idleCount: 0,
        waitingCount: 0,
      });
      await manager.disconnect();
    });

    it('returns SQLite single-connection metrics', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      expect(manager.getPoolMetrics()).toEqual({
        totalCount: 1,
        activeCount: 1,
        idleCount: 0,
        waitingCount: 0,
      });
      await manager.disconnect();
    });
  });

  describe('vendor-specific close paths', () => {
    it('closes the MySQL pool', async () => {
      const manager = new ConnectionManager({
        vendor: 'mysql',
        connection: 'mysql://localhost/test',
      });

      await manager.connect();
      await manager.close();

      expect(mockMysqlPoolEnd).toHaveBeenCalled();
    });

    it('closes the SQLite connection', async () => {
      const manager = new ConnectionManager({
        vendor: 'sqlite',
        connection: ':memory:',
      });

      await manager.connect();
      await manager.close();

      expect(mockSqliteClose).toHaveBeenCalled();
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });
  });
});
