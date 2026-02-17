/**
 * Connection configuration types for relational databases
 * @module connection/types
 */

import type { DatabaseVendor } from '../types.js';

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
  /** Additional mysql2-specific options */
  [key: string]: unknown;
}

/**
 * SQLite-specific connection configuration
 */
export interface SQLiteConnectionConfig {
  /** Database file path or ':memory:' for in-memory database */
  url: string;
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

