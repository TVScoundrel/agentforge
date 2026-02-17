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
 */
export interface MySQLConnectionConfig {
  /** Connection string (e.g., mysql://user:password@host:port/database) */
  uri?: string;
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
 */
export interface ConnectionConfig {
  /** Database vendor */
  vendor: DatabaseVendor;
  /** Vendor-specific connection configuration */
  connection: VendorConnectionConfig | string;
}

/**
 * Environment variable names for database connections
 */
export const ENV_VAR_NAMES = {
  postgresql: 'DATABASE_URL',
  mysql: 'DATABASE_URL',
  sqlite: 'DATABASE_URL',
} as const;

