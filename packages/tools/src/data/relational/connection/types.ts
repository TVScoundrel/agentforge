/**
 * Connection configuration types for relational databases
 * @module connection/types
 */

import type { DatabaseVendor } from '../types.js';

/**
 * Connection pool configuration options
 *
 * These options control how the connection pool manages database connections.
 * Different vendors may support different subsets of these options.
 *
 * Note: Some options are vendor-specific and may be ignored by certain drivers.
 * See vendor-specific documentation for supported options.
 */
export interface PoolConfig {
  /** Maximum number of connections in the pool (default: vendor-specific) */
  max?: number;
  /** Maximum time (ms) to wait for a connection from the pool before timing out */
  acquireTimeoutMillis?: number;
  /** Time (ms) a connection can remain idle before being closed (default: vendor-specific) */
  idleTimeoutMillis?: number;
}

/**
 * PostgreSQL-specific connection configuration
 */
export interface PostgreSQLConnectionConfig {
  /** Connection string (e.g., postgresql://user:password@host:port/database) */
  connectionString?: string;
  /** Host address */
  host?: string;
  /** Port number (default: 5432) */
  port?: number;
  /** Database name */
  database?: string;
  /** Username */
  user?: string;
  /** Password */
  password?: string;
  /** Enable SSL */
  ssl?: boolean | Record<string, unknown>;
  /** Connection timeout in milliseconds */
  connectionTimeoutMillis?: number;
  /** Connection pool configuration */
  pool?: PoolConfig;
  /** Additional pg-specific options */
  [key: string]: unknown;
}

/**
 * MySQL-specific connection configuration
 *
 * Note: mysql2.createPool accepts connection strings directly as a parameter,
 * not as a property of the config object. Use the ConnectionConfig discriminated
 * union type which allows either a config object OR a string.
 */
export interface MySQLConnectionConfig {
  /** Host address */
  host?: string;
  /** Port number (default: 3306) */
  port?: number;
  /** Database name */
  database?: string;
  /** Username */
  user?: string;
  /** Password */
  password?: string;
  /** Enable SSL */
  ssl?: boolean | Record<string, unknown>;
  /** Connection timeout in milliseconds */
  connectTimeout?: number;
  /** Connection pool configuration */
  pool?: PoolConfig;
  /** Additional mysql2-specific options */
  [key: string]: unknown;
}

/**
 * SQLite-specific connection configuration
 *
 * Note: SQLite typically uses a single connection with serialized access rather than a
 * traditional multi-connection pool. The `pool` configuration is accepted for API
 * consistency and future extensions, but it may not affect runtime behavior for SQLite.
 */
export interface SQLiteConnectionConfig {
  /** Database file path or ':memory:' for in-memory database */
  url: string;
  /**
   * Connection pool configuration.
   *
   * For SQLite this is primarily for API compatibility with other vendors and may be
   * ignored by the underlying driver.
   */
  pool?: PoolConfig;
  /** Additional better-sqlite3-specific options */
  [key: string]: unknown;
}

/**
 * Union type for vendor-specific connection configurations
 */
export type VendorConnectionConfig =
  | PostgreSQLConnectionConfig
  | MySQLConnectionConfig
  | SQLiteConnectionConfig;

/**
 * Connection configuration for ConnectionManager
 *
 * Uses a discriminated union to ensure that the connection string format
 * matches the selected database vendor at compile time.
 */
export type ConnectionConfig =
  | {
      /** PostgreSQL database vendor */
      vendor: Extract<DatabaseVendor, 'postgresql'>;
      /**
       * PostgreSQL-specific connection configuration or connection string.
       * When using a string, it should be a PostgreSQL URL
       * (e.g., "postgresql://user:password@host:port/database").
       */
      connection: PostgreSQLConnectionConfig | string;
    }
  | {
      /** MySQL database vendor */
      vendor: Extract<DatabaseVendor, 'mysql'>;
      /**
       * MySQL-specific connection configuration or connection string.
       * When using a string, it should be a MySQL URL
       * (e.g., "mysql://user:password@host:port/database").
       */
      connection: MySQLConnectionConfig | string;
    }
  | {
      /** SQLite database vendor */
      vendor: Extract<DatabaseVendor, 'sqlite'>;
      /**
       * SQLite-specific connection configuration or location.
       * Can be a file path, ':memory:' for in-memory database, or a config object.
       */
      connection: SQLiteConnectionConfig | string;
    };

