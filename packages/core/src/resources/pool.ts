/**
 * Connection pooling for database and HTTP clients
 */

export interface PoolConfig {
  min?: number;
  max?: number;
  acquireTimeout?: number;
  idleTimeout?: number;
  evictionInterval?: number;
}

export interface HealthCheckConfig {
  enabled?: boolean;
  interval?: number;
  timeout?: number;
  retries?: number;
}

export interface ConnectionPoolOptions<T> {
  factory: () => Promise<T>;
  destroyer?: (connection: T) => Promise<void>;
  validator?: (connection: T) => Promise<boolean>;
  pool?: PoolConfig;
  healthCheck?: HealthCheckConfig;
  onAcquire?: (connection: T) => void;
  onRelease?: (connection: T) => void;
  onDestroy?: (connection: T) => void;
  onHealthCheckFail?: (error: Error) => void;
}

export interface PoolStats {
  size: number;
  available: number;
  pending: number;
  acquired: number;
  created: number;
  destroyed: number;
  healthChecksPassed: number;
  healthChecksFailed: number;
}

interface PooledConnection<T> {
  connection: T;
  createdAt: number;
  lastUsedAt: number;
  inUse: boolean;
}

interface PendingAcquisition<T> {
  resolve: (connection: T) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class ConnectionPool<T> {
  private connections: PooledConnection<T>[] = [];
  private pending: PendingAcquisition<T>[] = [];
  private stats: PoolStats = {
    size: 0,
    available: 0,
    pending: 0,
    acquired: 0,
    created: 0,
    destroyed: 0,
    healthChecksPassed: 0,
    healthChecksFailed: 0,
  };
  private evictionTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private draining = false;

  constructor(private options: ConnectionPoolOptions<T>) {
    const poolConfig = options.pool || {};
    const min = poolConfig.min || 0;

    // Initialize minimum connections
    if (min > 0) {
      this.initialize(min).catch((error) => {
        console.error('Failed to initialize pool:', error);
      });
    }

    // Start eviction timer
    const evictionInterval = poolConfig.evictionInterval || 60000;
    this.evictionTimer = setInterval(() => {
      this.evictIdleConnections().catch((error) => {
        console.error('Failed to evict idle connections:', error);
      });
    }, evictionInterval);

    // Start health check timer
    const healthCheck = options.healthCheck || {};
    if (healthCheck.enabled) {
      const interval = healthCheck.interval || 30000;
      this.healthCheckTimer = setInterval(() => {
        this.performHealthChecks().catch((error) => {
          console.error('Health check failed:', error);
          options.onHealthCheckFail?.(error);
        });
      }, interval);
    }
  }

  private async initialize(count: number): Promise<void> {
    const promises = Array.from({ length: count }, () => this.createConnection());
    await Promise.all(promises);
  }

  private async createConnection(): Promise<T> {
    const connection = await this.options.factory();
    this.connections.push({
      connection,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      inUse: false,
    });
    this.stats.created++;
    this.stats.size++;
    this.stats.available++;
    return connection;
  }

  private async destroyConnection(pooled: PooledConnection<T>): Promise<void> {
    const index = this.connections.indexOf(pooled);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }

    if (this.options.destroyer) {
      await this.options.destroyer(pooled.connection);
    }

    this.options.onDestroy?.(pooled.connection);
    this.stats.destroyed++;
    this.stats.size--;
    if (!pooled.inUse) {
      this.stats.available--;
    }
  }

  async acquire(): Promise<T> {
    if (this.draining) {
      throw new Error('Pool is draining');
    }

    // Try to find an available connection
    const available = this.connections.find((c) => !c.inUse);
    if (available) {
      available.inUse = true;
      available.lastUsedAt = Date.now();
      this.stats.available--;
      this.stats.acquired++;
      this.options.onAcquire?.(available.connection);
      return available.connection;
    }

    // Try to create a new connection if under max
    const poolConfig = this.options.pool || {};
    const max = poolConfig.max || 10;
    if (this.connections.length < max) {
      const connection = await this.createConnection();
      const pooled = this.connections.find((c) => c.connection === connection)!;
      pooled.inUse = true;
      this.stats.available--;
      this.stats.acquired++;
      this.options.onAcquire?.(connection);
      return connection;
    }

    // Wait for a connection to become available
    return new Promise<T>((resolve, reject) => {
      const timeout = poolConfig.acquireTimeout || 30000;
      const timer = setTimeout(() => {
        const index = this.pending.findIndex((p) => p.resolve === resolve);
        if (index !== -1) {
          this.pending.splice(index, 1);
          this.stats.pending--;
        }
        reject(new Error('Acquire timeout'));
      }, timeout);

      this.pending.push({ resolve, reject, timeout: timer });
      this.stats.pending++;
    });
  }

  async release(connection: T): Promise<void> {
    const pooled = this.connections.find((c) => c.connection === connection);
    if (!pooled) {
      throw new Error('Connection not found in pool');
    }

    if (!pooled.inUse) {
      throw new Error('Connection is not in use');
    }

    pooled.inUse = false;
    pooled.lastUsedAt = Date.now();
    this.stats.available++;
    this.stats.acquired--;
    this.options.onRelease?.(connection);

    // Fulfill pending acquisition if any
    const pending = this.pending.shift();
    if (pending) {
      clearTimeout(pending.timeout);
      this.stats.pending--;
      pooled.inUse = true;
      this.stats.available--;
      this.stats.acquired++;
      this.options.onAcquire?.(connection);
      pending.resolve(connection);
    }
  }

  private async evictIdleConnections(): Promise<void> {
    const poolConfig = this.options.pool || {};
    const idleTimeout = poolConfig.idleTimeout || 60000;
    const min = poolConfig.min || 0;
    const now = Date.now();

    const toEvict = this.connections.filter(
      (c) => !c.inUse && now - c.lastUsedAt > idleTimeout && this.connections.length > min
    );

    for (const pooled of toEvict) {
      await this.destroyConnection(pooled);
    }
  }

  private async performHealthChecks(): Promise<void> {
    if (!this.options.validator) {
      return;
    }

    const healthCheck = this.options.healthCheck || {};
    const timeout = healthCheck.timeout || 5000;
    const retries = healthCheck.retries || 1;

    for (const pooled of this.connections) {
      if (pooled.inUse) {
        continue;
      }

      let healthy = false;
      for (let i = 0; i < retries; i++) {
        try {
          const result = await Promise.race([
            this.options.validator(pooled.connection),
            new Promise<boolean>((_, reject) =>
              setTimeout(() => reject(new Error('Health check timeout')), timeout)
            ),
          ]);
          if (result) {
            healthy = true;
            break;
          }
        } catch (error) {
          // Continue to next retry
        }
      }

      if (healthy) {
        this.stats.healthChecksPassed++;
      } else {
        this.stats.healthChecksFailed++;
        await this.destroyConnection(pooled);
      }
    }
  }

  async drain(): Promise<void> {
    this.draining = true;

    // Reject all pending acquisitions
    for (const pending of this.pending) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Pool is draining'));
    }
    this.pending = [];
    this.stats.pending = 0;

    // Wait for all connections to be released
    while (this.connections.some((c) => c.inUse)) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async clear(): Promise<void> {
    // Stop timers
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = undefined;
    }
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    // Destroy all connections
    const connections = [...this.connections];
    for (const pooled of connections) {
      await this.destroyConnection(pooled);
    }
  }

  getStats(): PoolStats {
    return { ...this.stats };
  }
}

export function createConnectionPool<T>(options: ConnectionPoolOptions<T>): ConnectionPool<T> {
  return new ConnectionPool(options);
}

