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
 *
 * NOTE: The execute() signature was changed from execute(sql: string, params?: unknown)
 * to execute(query: SQL) in ST-02001 to align with Drizzle's type-safe SQL template design.
 * This is a breaking change but provides better type safety and prevents SQL injection.
 * Parameter binding is now handled by buildParameterizedQuery() before calling execute().
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

