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

export class ConnectionPool<T> implements ConnectionPoolRuntime<T> {
  connections: ConnectionPoolRuntime<T>['connections'] = [];
  pending: ConnectionPoolRuntime<T>['pending'] = [];
  stats: PoolStats = createInitialPoolStats();
  draining = false;
  evictionTimer?: NodeJS.Timeout;
  healthCheckTimer?: NodeJS.Timeout;

  constructor(public options: ConnectionPoolOptions<T>) {
    const poolConfig = getPoolConfig(this);
    const min = poolConfig.min || 0;
    if (min > 0) {
      initializeConnections(this, min).catch((error) => {
        console.error('Failed to initialize pool:', error);
      });
    }

    const evictionInterval = poolConfig.evictionInterval || 60000;
    this.evictionTimer = setInterval(() => {
      evictIdleConnections(this).catch((error) => {
        console.error('Failed to evict idle connections:', error);
      });
    }, evictionInterval);

    const healthCheck = getHealthCheckConfig(this);
    if (healthCheck.enabled) {
      const interval = healthCheck.interval || 30000;
      this.healthCheckTimer = setInterval(() => {
        performHealthChecks(this).catch((error) => {
          console.error('Health check failed:', error);
          this.options.onHealthCheckFail?.(error);
        });
      }, interval);
    }
  }

  async acquire(): Promise<T> {
    return acquireConnection(this);
  }

  async release(connection: T): Promise<void> {
    return releaseConnection(this, connection);
  }

  async drain(): Promise<void> {
    return drainPool(this);
  }

  async clear(): Promise<void> {
    return clearPool(this);
  }

  getStats(): PoolStats {
    return clonePoolStats(this);
  }
}

export function createConnectionPool<T>(options: ConnectionPoolOptions<T>): ConnectionPool<T> {
  return new ConnectionPool(options);
}
