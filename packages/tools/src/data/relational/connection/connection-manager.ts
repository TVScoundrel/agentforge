/**
 * Connection manager for relational databases using Drizzle ORM
 * @module connection/connection-manager
 */

import type { DatabaseConnection, DatabaseVendor } from '../types.js';
import type { ConnectionConfig } from './types.js';
import { checkPeerDependency } from '../utils/peer-dependency-checker.js';
import { sql } from 'drizzle-orm';
import { createLogger } from '@agentforge/core';

const logger = createLogger('agentforge:tools:data:relational:connection');

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

    const baseConfig = typeof this.config.connection === 'string'
      ? { connectionString: this.config.connection }
      : this.config.connection;

    // Apply pool configuration if provided
    const poolConfig = typeof this.config.connection === 'object'
      ? this.config.connection.pool
      : undefined;

    const connectionConfig = {
      ...baseConfig,
      // Map our PoolConfig to pg.Pool options
      ...(poolConfig?.min !== undefined && { min: poolConfig.min }),
      ...(poolConfig?.max !== undefined && { max: poolConfig.max }),
      ...(poolConfig?.idleTimeoutMillis !== undefined && { idleTimeoutMillis: poolConfig.idleTimeoutMillis }),
      ...(poolConfig?.acquireTimeoutMillis !== undefined && { connectionTimeoutMillis: poolConfig.acquireTimeoutMillis }),
    };

    logger.debug('Creating PostgreSQL connection pool', {
      vendor: this.vendor,
      poolConfig: {
        min: connectionConfig.min,
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
      const baseConfig = this.config.connection;
      const poolConfig = baseConfig.pool;

      connectionConfig = {
        ...baseConfig,
        // Remove our pool property to avoid passing it to mysql2
        pool: undefined,
        // Map our PoolConfig to mysql2 pool options
        ...(poolConfig?.max !== undefined && { connectionLimit: poolConfig.max }),
        ...(poolConfig?.acquireTimeoutMillis !== undefined && { acquireTimeout: poolConfig.acquireTimeoutMillis }),
        ...(poolConfig?.idleTimeoutMillis !== undefined && { idleTimeout: poolConfig.idleTimeoutMillis }),
        ...(poolConfig?.maxLifetimeMillis !== undefined && { maxIdle: poolConfig.maxLifetimeMillis }),
      };

      logger.debug('Creating MySQL connection pool', {
        vendor: this.vendor,
        poolConfig: {
          connectionLimit: connectionConfig.connectionLimit,
          acquireTimeout: connectionConfig.acquireTimeout,
          idleTimeout: connectionConfig.idleTimeout,
          maxIdle: connectionConfig.maxIdle,
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

    // Log pool config if provided (for awareness, but SQLite doesn't use traditional pooling)
    if (typeof this.config.connection === 'object' && this.config.connection.pool) {
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
   * Execute a raw SQL query
   *
   * ⚠️ SECURITY WARNING: This method is for internal use only and should NOT be exposed
   * to user input. It executes raw SQL strings without parameter binding, which creates
   * SQL injection vulnerabilities.
   *
   * This method is currently used only for internal health checks (SELECT 1).
   * ST-02001 will implement a proper public API with parameter binding or Drizzle SQL objects.
   *
   * @internal
   * @param sqlString - SQL query string (must be a trusted constant, never user input)
   * @param _params - Query parameters (currently unused - will be implemented in ST-02001)
   * @returns Query result
   */
  async execute(sqlString: string, _params?: unknown[]): Promise<unknown> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    logger.debug('Executing SQL query', {
      vendor: this.vendor,
      sqlPreview: sqlString.substring(0, 100)
    });

    // TODO (ST-02001): Implement proper parameter binding or accept Drizzle SQL objects
    // For now, execute raw SQL without parameter binding - INTERNAL USE ONLY
    return this.db.execute(sql.raw(sqlString));
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
    idleCount: number;
    waitingCount: number;
  } {
    if (!this.client) {
      return { totalCount: 0, idleCount: 0, waitingCount: 0 };
    }

    if (this.vendor === 'postgresql') {
      // pg.Pool provides these properties
      return {
        totalCount: this.client.totalCount || 0,
        idleCount: this.client.idleCount || 0,
        waitingCount: this.client.waitingCount || 0,
      };
    } else if (this.vendor === 'mysql') {
      // mysql2.Pool provides pool statistics through _allConnections and _freeConnections
      const pool = this.client.pool || this.client;
      return {
        totalCount: pool._allConnections?.length || 0,
        idleCount: pool._freeConnections?.length || 0,
        waitingCount: pool._connectionQueue?.length || 0,
      };
    } else {
      // SQLite uses a single connection
      return {
        totalCount: this.client.open ? 1 : 0,
        idleCount: 0,
        waitingCount: 0,
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
      await this.execute('SELECT 1');
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

