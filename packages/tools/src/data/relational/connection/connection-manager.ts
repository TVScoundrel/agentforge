/**
 * Connection manager for relational databases using Drizzle ORM
 * @module connection/connection-manager
 */

import type { DatabaseConnection, DatabaseVendor } from '../types.js';
import type { ConnectionConfig, PoolConfig } from './types.js';
import { checkPeerDependency } from '../utils/peer-dependency-checker.js';
import { sql, type SQL } from 'drizzle-orm';
import { createLogger } from '@agentforge/core';

const logger = createLogger('agentforge:tools:data:relational:connection');

/**
 * Validate pool configuration
 * @param poolConfig - Pool configuration to validate
 * @throws {Error} If pool configuration is invalid
 */
function validatePoolConfig(poolConfig: PoolConfig): void {
  if (poolConfig.max !== undefined && poolConfig.max < 1) {
    throw new Error('Pool max connections must be >= 1');
  }

  if (poolConfig.acquireTimeoutMillis !== undefined && poolConfig.acquireTimeoutMillis < 0) {
    throw new Error('Pool acquire timeout must be >= 0');
  }

  if (poolConfig.idleTimeoutMillis !== undefined && poolConfig.idleTimeoutMillis < 0) {
    throw new Error('Pool idle timeout must be >= 0');
  }
}

/**
 * Connection manager that handles database connections for PostgreSQL, MySQL, and SQLite
 * using Drizzle ORM
 */
export class ConnectionManager implements DatabaseConnection {
  private vendor: DatabaseVendor;
  private db: any; // Drizzle database instance
  private client: any; // Underlying database client (pg.Pool, mysql2.Pool, or better-sqlite3.Database)
  private config: ConnectionConfig;

  /**
   * Create a new ConnectionManager instance
   * @param config - Connection configuration
   */
  constructor(config: ConnectionConfig) {
    this.config = config;
    this.vendor = config.vendor;
    
    // Check for required peer dependency before attempting connection
    checkPeerDependency(this.vendor);
  }

  /**
   * Initialize the database connection
   * @throws {Error} If connection fails or configuration is invalid
   */
  async initialize(): Promise<void> {
    const startTime = Date.now();
    logger.info('Initializing database connection', {
      vendor: this.vendor,
      connectionType: typeof this.config.connection
    });

    try {
      switch (this.vendor) {
        case 'postgresql':
          await this.initializePostgreSQL();
          break;
        case 'mysql':
          await this.initializeMySQL();
          break;
        case 'sqlite':
          await this.initializeSQLite();
          break;
        default:
          throw new Error(`Unsupported database vendor: ${this.vendor}`);
      }

      // Validate connection after initialization
      logger.debug('Validating connection health', { vendor: this.vendor });
      const healthy = await this.isHealthy();
      if (!healthy) {
        throw new Error(`Failed to establish healthy connection to ${this.vendor} database`);
      }

      logger.info('Database connection initialized successfully', {
        vendor: this.vendor,
        duration: Date.now() - startTime
      });
    } catch (error) {
      const errorMessage = `Failed to initialize ${this.vendor} connection`;
      logger.error(errorMessage, {
        vendor: this.vendor,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });

      if (error instanceof Error) {
        throw new Error(errorMessage, { cause: error });
      }
      throw new Error(`${errorMessage}: ${String(error)}`);
    }
  }

  /**
   * Initialize PostgreSQL connection using Drizzle ORM with node-postgres
   *
   * Applies pool configuration options to pg.Pool for connection management.
   */
  private async initializePostgreSQL(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');

    // Extract pool config and base config separately to avoid passing unknown 'pool' property to pg.Pool
    const { pool: poolConfig, ...baseConfig } = typeof this.config.connection === 'string'
      ? { connectionString: this.config.connection }
      : this.config.connection;

    // Validate pool configuration
    if (poolConfig) {
      validatePoolConfig(poolConfig);
    }

    const connectionConfig = {
      ...baseConfig,
      // Map our PoolConfig to pg.Pool options
      // Note: pg.Pool does not support a `min` option
      ...(poolConfig?.max !== undefined && { max: poolConfig.max }),
      ...(poolConfig?.idleTimeoutMillis !== undefined && { idleTimeoutMillis: poolConfig.idleTimeoutMillis }),
      ...(poolConfig?.acquireTimeoutMillis !== undefined && { connectionTimeoutMillis: poolConfig.acquireTimeoutMillis }),
    };

    logger.debug('Creating PostgreSQL connection pool', {
      vendor: this.vendor,
      poolConfig: {
        max: connectionConfig.max,
        idleTimeoutMillis: connectionConfig.idleTimeoutMillis,
        connectionTimeoutMillis: connectionConfig.connectionTimeoutMillis,
      }
    });

    this.client = new Pool(connectionConfig);
    this.db = drizzle({ client: this.client });
  }

  /**
   * Initialize MySQL connection using Drizzle ORM with mysql2
   *
   * Applies pool configuration options to mysql2.createPool for connection management.
   */
  private async initializeMySQL(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/mysql2');
    const mysql = await import('mysql2/promise');

    // mysql2.createPool accepts both connection strings directly and config objects
    // When a string is provided, we can't apply pool config (would need to parse URL)
    let connectionConfig: any;

    if (typeof this.config.connection === 'string') {
      connectionConfig = this.config.connection;
      logger.debug('Creating MySQL connection pool from connection string', {
        vendor: this.vendor,
      });
    } else {
      // Destructure to separate pool config from mysql2 config
      const { pool: poolConfig, ...baseConfig } = this.config.connection;

      // Validate pool configuration
      if (poolConfig) {
        validatePoolConfig(poolConfig);
      }

      connectionConfig = {
        ...baseConfig,
        // Map our PoolConfig to mysql2 pool options
        ...(poolConfig?.max !== undefined && { connectionLimit: poolConfig.max }),
        ...(poolConfig?.acquireTimeoutMillis !== undefined && { acquireTimeout: poolConfig.acquireTimeoutMillis }),
        ...(poolConfig?.idleTimeoutMillis !== undefined && { idleTimeout: poolConfig.idleTimeoutMillis }),
      };

      logger.debug('Creating MySQL connection pool', {
        vendor: this.vendor,
        poolConfig: {
          connectionLimit: connectionConfig.connectionLimit,
          acquireTimeout: connectionConfig.acquireTimeout,
          idleTimeout: connectionConfig.idleTimeout,
        }
      });
    }

    // createPool is synchronous and returns a Pool instance directly
    this.client = mysql.createPool(connectionConfig);
    this.db = drizzle({ client: this.client });
  }

  /**
   * Initialize SQLite connection using Drizzle ORM with better-sqlite3
   *
   * Note: SQLite uses a single connection. Pool configuration is logged but not applied
   * as SQLite handles concurrent access through its internal locking mechanism.
   */
  private async initializeSQLite(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const DatabaseModule = await import('better-sqlite3');

    // better-sqlite3 uses CommonJS module.exports, which becomes .default in ESM
    const Database = DatabaseModule.default;

    const url = typeof this.config.connection === 'string'
      ? this.config.connection
      : (this.config.connection as any).url;

    if (!url) {
      throw new Error('SQLite connection requires a url property');
    }

    // Validate and log pool config if provided (for awareness, but SQLite doesn't use traditional pooling)
    if (typeof this.config.connection === 'object' && this.config.connection.pool) {
      validatePoolConfig(this.config.connection.pool);
      logger.debug('SQLite pool configuration provided but not applied (SQLite uses single connection)', {
        vendor: this.vendor,
        poolConfig: this.config.connection.pool,
      });
    }

    logger.debug('Creating SQLite connection', {
      vendor: this.vendor,
      url: url === ':memory:' ? ':memory:' : 'file',
    });

    this.client = new Database(url);
    this.db = drizzle({ client: this.client });
  }

  /**
   * Execute a SQL query
   *
   * Executes a parameterized SQL query using Drizzle's SQL template objects.
   * This method provides safe parameter binding to prevent SQL injection.
   *
   * @param query - Drizzle SQL template object with parameter binding
   * @returns Query result
   *
   * @example
   * ```typescript
   * import { sql } from 'drizzle-orm';
   *
   * const result = await manager.execute(
   *   sql`SELECT * FROM users WHERE id = ${userId}`
   * );
   * ```
   */
  async execute(query: SQL): Promise<unknown> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    logger.debug('Executing SQL query', {
      vendor: this.vendor
    });

    return this.db.execute(query);
  }

  /**
   * Get connection pool metrics
   *
   * Returns information about the current state of the connection pool.
   * For SQLite, returns basic connection status since it uses a single connection.
   *
   * @returns Pool metrics including total, active, idle, and waiting connections
   */
  getPoolMetrics(): {
    totalCount: number;
    activeCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    if (!this.client) {
      return { totalCount: 0, activeCount: 0, idleCount: 0, waitingCount: 0 };
    }

    if (this.vendor === 'postgresql') {
      // pg.Pool provides these properties via public API
      const totalCount = this.client.totalCount || 0;
      const idleCount = this.client.idleCount || 0;
      const waitingCount = this.client.waitingCount || 0;
      const activeCount = Math.max(totalCount - idleCount, 0);

      return {
        totalCount,
        activeCount,
        idleCount,
        waitingCount,
      };
    } else if (this.vendor === 'mysql') {
      // mysql2 does not expose a stable public API for pool metrics.
      // To avoid relying on private/internal fields (e.g. _allConnections),
      // we return neutral metrics here and treat MySQL pool stats as unavailable.
      return {
        totalCount: 0,
        activeCount: 0,
        idleCount: 0,
        waitingCount: 0,
      };
    } else {
      // SQLite uses a single connection
      const totalCount = this.client.open ? 1 : 0;
      const idleCount = 0;
      const waitingCount = 0;
      const activeCount = this.client.open ? 1 : 0;

      return {
        totalCount,
        activeCount,
        idleCount,
        waitingCount,
      };
    }
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.client) {
      logger.info('Closing database connection', { vendor: this.vendor });

      try {
        if (this.vendor === 'postgresql' || this.vendor === 'mysql') {
          await this.client.end();
        } else if (this.vendor === 'sqlite') {
          this.client.close();
        }
        logger.debug('Database connection closed successfully', { vendor: this.vendor });
      } catch (error) {
        logger.error('Error closing database connection', {
          vendor: this.vendor,
          error: error instanceof Error ? error.message : String(error)
        });
        // Don't re-throw - we still want to clean up state
      } finally {
        this.client = null;
        this.db = null;
      }
    }
  }

  /**
   * Check if the connection is healthy
   * @returns true if connection is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    if (!this.db || !this.client) {
      logger.debug('Health check failed: connection not initialized', { vendor: this.vendor });
      return false;
    }

    try {
      // Execute a simple query to check connection health
      await this.execute(sql`SELECT 1`);
      logger.debug('Health check passed', { vendor: this.vendor });
      return true;
    } catch (error) {
      logger.debug('Health check failed', {
        vendor: this.vendor,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}

