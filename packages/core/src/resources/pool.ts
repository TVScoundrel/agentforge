/**
 * Connection pooling for database and HTTP clients
 */

import { acquireConnection, releaseConnection } from './pool-acquisition.js';
import { evictIdleConnections } from './pool-eviction.js';
import { performHealthChecks } from './pool-health.js';
import { clearPool, drainPool } from './pool-lifecycle.js';
import {
  clonePoolStats,
  createInitialPoolStats,
  getHealthCheckConfig,
  getPoolConfig,
  initializeConnections,
} from './pool-runtime.js';
import type { ConnectionPoolRuntime, ConnectionPoolOptions, PoolStats } from './pool-types.js';

export type { ConnectionPoolOptions, HealthCheckConfig, PoolConfig, PoolStats } from './pool-types.js';

export class ConnectionPool<T> {
  private readonly runtime: ConnectionPoolRuntime<T>;

  constructor(private readonly options: ConnectionPoolOptions<T>) {
    this.runtime = {
      connections: [],
      pending: [],
      stats: createInitialPoolStats(),
      draining: false,
      options,
    };

    const poolConfig = getPoolConfig(this.runtime);
    const min = poolConfig.min || 0;
    if (min > 0) {
      initializeConnections(this.runtime, min).catch((error) => {
        console.error('Failed to initialize pool:', error);
      });
    }

    const evictionInterval = poolConfig.evictionInterval || 60000;
    this.runtime.evictionTimer = setInterval(() => {
      evictIdleConnections(this.runtime).catch((error) => {
        console.error('Failed to evict idle connections:', error);
      });
    }, evictionInterval);

    const healthCheck = getHealthCheckConfig(this.runtime);
    if (healthCheck.enabled) {
      const interval = healthCheck.interval || 30000;
      this.runtime.healthCheckTimer = setInterval(() => {
        performHealthChecks(this.runtime).catch((error) => {
          console.error('Health check failed:', error);
          options.onHealthCheckFail?.(error);
        });
      }, interval);
    }
  }

  async acquire(): Promise<T> {
    return acquireConnection(this.runtime);
  }

  async release(connection: T): Promise<void> {
    return releaseConnection(this.runtime, connection);
  }

  async drain(): Promise<void> {
    return drainPool(this.runtime);
  }

  async clear(): Promise<void> {
    return clearPool(this.runtime);
  }

  getStats(): PoolStats {
    return clonePoolStats(this.runtime);
  }
}

export function createConnectionPool<T>(options: ConnectionPoolOptions<T>): ConnectionPool<T> {
  return new ConnectionPool(options);
}
