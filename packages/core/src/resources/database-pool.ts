/**
 * Database connection pool implementation
 */

import { createConnectionPool, ConnectionPool, PoolConfig, HealthCheckConfig } from './pool.js';

export interface DatabaseConfig {
  host: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  connectionTimeout?: number;
}

export interface DatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

export interface DatabasePoolOptions {
  config: DatabaseConfig;
  pool?: PoolConfig;
  healthCheck?: HealthCheckConfig & {
    query?: string;
  };
  onConnect?: (connection: DatabaseConnection) => void;
  onDisconnect?: (connection: DatabaseConnection) => void;
}

/**
 * Mock database connection for demonstration
 * In production, replace with actual database client (pg, mysql2, etc.)
 */
class MockDatabaseConnection implements DatabaseConnection {
  private closed = false;

  constructor(private config: DatabaseConfig) {}

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    if (this.closed) {
      throw new Error('Connection is closed');
    }
    // Mock implementation
    return [] as T;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (this.closed) {
      throw new Error('Connection is closed');
    }
    // Mock implementation
  }

  async close(): Promise<void> {
    this.closed = true;
  }
}

export class DatabasePool {
  private pool: ConnectionPool<DatabaseConnection>;

  constructor(private options: DatabasePoolOptions) {
    const healthCheckQuery = options.healthCheck?.query || 'SELECT 1';

    this.pool = createConnectionPool<DatabaseConnection>({
      factory: async () => {
        const connection = new MockDatabaseConnection(options.config);
        options.onConnect?.(connection);
        return connection;
      },
      destroyer: async (connection) => {
        await connection.close();
        options.onDisconnect?.(connection);
      },
      validator: async (connection) => {
        try {
          await connection.query(healthCheckQuery);
          return true;
        } catch {
          return false;
        }
      },
      pool: options.pool,
      healthCheck: options.healthCheck,
    });
  }

  async acquire(): Promise<DatabaseConnection> {
    return this.pool.acquire();
  }

  async release(connection: DatabaseConnection): Promise<void> {
    return this.pool.release(connection);
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const connection = await this.acquire();
    try {
      return await connection.query<T>(sql, params);
    } finally {
      await this.release(connection);
    }
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    const connection = await this.acquire();
    try {
      await connection.execute(sql, params);
    } finally {
      await this.release(connection);
    }
  }

  async drain(): Promise<void> {
    return this.pool.drain();
  }

  async clear(): Promise<void> {
    return this.pool.clear();
  }

  getStats() {
    return this.pool.getStats();
  }
}

export function createDatabasePool(options: DatabasePoolOptions): DatabasePool {
  return new DatabasePool(options);
}

