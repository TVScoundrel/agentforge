/**
 * Shared types for relational database operations
 * @module types
 */

import type { SQL } from 'drizzle-orm';

/**
 * Supported database vendors
 */
export type DatabaseVendor = 'postgresql' | 'mysql' | 'sqlite';

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  /** Database vendor type */
  vendor: DatabaseVendor;
  /** Connection string or configuration object */
  connection: string | Record<string, unknown>;
  /** Optional connection pool configuration */
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
  };
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  /** Execute a Drizzle SQL query */
  execute(query: SQL): Promise<unknown>;
  /** Close the connection */
  close(): Promise<void>;
  /** Check if connection is healthy */
  isHealthy(): Promise<boolean>;
}

/**
 * Query result metadata
 */
export interface QueryMetadata {
  /** Number of rows affected */
  rowCount?: number;
  /** Execution time in milliseconds */
  executionTime?: number;
  /** Additional vendor-specific metadata */
  [key: string]: unknown;
}

/**
 * Query result with data and metadata
 */
export interface QueryResult<T = unknown> {
  /** Query result data */
  data: T[];
  /** Query metadata */
  metadata: QueryMetadata;
}

