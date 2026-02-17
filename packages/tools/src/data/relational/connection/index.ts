/**
 * Database connection management
 * @module connection
 */

export { ConnectionManager, ConnectionState } from './connection-manager.js';
export type {
  ConnectionConfig,
  PostgreSQLConnectionConfig,
  MySQLConnectionConfig,
  SQLiteConnectionConfig,
  VendorConnectionConfig,
  PoolConfig,
} from './types.js';
export type { ConnectionEvent, ReconnectionConfig } from './connection-manager.js';

