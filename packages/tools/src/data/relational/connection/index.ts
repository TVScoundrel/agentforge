/**
 * Database connection management
 * @module connection
 */

export { ConnectionManager } from './connection-manager.js';
export type {
  ConnectionConfig,
  PostgreSQLConnectionConfig,
  MySQLConnectionConfig,
  SQLiteConnectionConfig,
  VendorConnectionConfig,
  PoolConfig,
} from './types.js';

