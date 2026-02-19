/**
 * Relational database access tools using Drizzle ORM
 * 
 * Provides vendor-agnostic database operations for PostgreSQL, MySQL, and SQLite.
 * 
 * ## Peer Dependencies
 * 
 * This module requires database-specific drivers as peer dependencies.
 * Install only the drivers you need:
 * 
 * - **PostgreSQL**: `pnpm add pg @types/pg`
 * - **MySQL**: `pnpm add mysql2`
 * - **SQLite**: `pnpm add better-sqlite3 @types/better-sqlite3`
 * 
 * @module relational
 */

// Export types
export type {
  DatabaseVendor,
  DatabaseConfig,
  DatabaseConnection,
  QueryMetadata,
  QueryResult,
} from './types.js';

// Export utilities
export {
  checkPeerDependency,
  getPeerDependencyName,
  getInstallationInstructions,
  MissingPeerDependencyError,
} from './utils/index.js';

// Connection management
export * from './connection/index.js';

// Query operations
export * from './query/index.js';

// Schema introspection
export * from './schema/index.js';

// LangGraph tools
export * from './tools/index.js';
