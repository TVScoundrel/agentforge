/**
 * MySQL Connection Integration Tests
 *
 * Tests real MySQL connection lifecycle using testcontainers.
 * Requires Docker to be running.
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { ConnectionManager, ConnectionState } from '../../../../../src/data/relational/connection/connection-manager.js';
import type { ConnectionConfig } from '../../../../../src/data/relational/connection/types.js';
import {
  startMySQLContainer,
  stopMySQLContainer,
  type MySQLContainerInfo,
} from '../setup/containers.js';

let mysqlContainer: MySQLContainerInfo;

describe('MySQL Connection Integration', () => {
  let manager: ConnectionManager;

  beforeAll(async () => {
    mysqlContainer = await startMySQLContainer();
  }, 120_000);

  afterAll(async () => {
    if (mysqlContainer) {
      await stopMySQLContainer(mysqlContainer);
    }
  }, 30_000);

  afterEach(async () => {
    if (manager && manager.isConnected()) {
      await manager.disconnect();
    }
  });

  describe('Connection Lifecycle', () => {
    it('should connect using config object', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      expect(manager.isConnected()).toBe(true);
      expect(manager.getState()).toBe(ConnectionState.CONNECTED);
    });

    it('should report healthy after connection', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();

      const healthy = await manager.isHealthy();
      expect(healthy).toBe(true);
    });

    it('should disconnect cleanly', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      await manager.disconnect();

      expect(manager.isConnected()).toBe(false);
      expect(manager.getState()).toBe(ConnectionState.DISCONNECTED);
    });

    it('should emit lifecycle events', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
        },
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
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: 'wrong_user',
          password: 'wrong_password',
        },
      };

      manager = new ConnectionManager(config);
      await expect(manager.connect()).rejects.toThrow();
    });

    it('should support reconnection after disconnect', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      expect(manager.isConnected()).toBe(true);

      await manager.disconnect();
      expect(manager.isConnected()).toBe(false);

      await manager.connect();
      expect(manager.isConnected()).toBe(true);
    });

    it('should dispose cleanly', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
        },
      };

      manager = new ConnectionManager(config);
      await manager.connect();
      await manager.dispose();

      expect(manager.isConnected()).toBe(false);
    });

    it('should support pool configuration', async () => {
      const config: ConnectionConfig = {
        vendor: 'mysql',
        connection: {
          host: mysqlContainer.host,
          port: mysqlContainer.port,
          database: mysqlContainer.database,
          user: mysqlContainer.user,
          password: mysqlContainer.password,
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
