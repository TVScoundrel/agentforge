/**
 * PostgreSQL Connection Integration Tests
 *
 * Tests real PostgreSQL connection lifecycle using testcontainers.
 * Requires Docker to be running.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import {
  startPostgreSQLContainer,
  stopPostgreSQLContainer,
  type PostgreSQLContainerInfo,
} from '../setup/containers.js';

let pgContainer: PostgreSQLContainerInfo;

describe('PostgreSQL Connection Integration', () => {
  let manager: ConnectionManager;

  beforeAll(async () => {
    pgContainer = await startPostgreSQLContainer();
  }, 120_000);

  afterAll(async () => {
    if (pgContainer) {
      await stopPostgreSQLContainer(pgContainer);
    }
  }, 30_000);

  afterEach(async () => {
    if (manager && manager.isConnected()) {
      await manager.disconnect();
    }
  });

  describe('Connection Lifecycle', () => {
    it('should connect using connection string', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.isConnected()).toBe(true);
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);
    });

    it('should connect using config object', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: {
          host: pgContainer.host,
          port: pgContainer.port,
          database: pgContainer.database,
          user: pgContainer.user,
          password: pgContainer.password,
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.isConnected()).toBe(true);
    });

    it('should report healthy after connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      await manager.disconnect();

      expect(manager.isConnected()).toBe(false);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should emit lifecycle events', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);

      const events: string[] = [];
      manager.on('connected', () => events.push('connected'));
      manager.on('disconnected', () => events.push('disconnected'));

      await manager.connect();
      await manager.disconnect();

      expect(events).toContain('connected');
      expect(events).toContain('disconnected');
    });

    it('should fail to connect with invalid credentials', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: {
          host: pgContainer.host,
          port: pgContainer.port,
          database: pgContainer.database,
          user: 'wrong_user',
          password: 'wrong_password',
        },
      };

      manager = new ConnectionManager(config);
      await expect(manager.connect()).rejects.toThrow();
    });

    it('should support reconnection after disconnect', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      await manager.disconnect();
      expect(manager.isConnected()).toBe(false);

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
    });

    it('should return pool metrics', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      const metrics = manager.getPoolMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalCount).toBe('number');
      expect(typeof metrics.idleCount).toBe('number');
      expect(typeof metrics.waitingCount).toBe('number');
    });

    it('should dispose cleanly', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: pgContainer.connectionString,
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      await manager.dispose();

      expect(manager.isConnected()).toBe(false);
    });

    it('should support pool configuration', async () => {
      const config: ConnectionConfig = {
        vendor: 'postgresql',
        connection: {
          host: pgContainer.host,
          port: pgContainer.port,
          database: pgContainer.database,
          user: pgContainer.user,
          password: pgContainer.password,
          pool: {
            max: 5,
            acquireTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
          },
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.isConnected()).toBe(true);
    });
  });
});
