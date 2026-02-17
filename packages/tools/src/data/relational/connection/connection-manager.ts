/**
 * Connection manager for relational databases using Drizzle ORM
 * @module connection/connection-manager
 */

import type { DatabaseConnection, DatabaseVendor } from '../types.js';
import type { ConnectionConfig } from './types.js';
import { checkPeerDependency } from '../utils/peer-dependency-checker.js';

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
      const healthy = await this.isHealthy();
      if (!healthy) {
        throw new Error(`Failed to establish healthy connection to ${this.vendor} database`);
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize ${this.vendor} connection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Initialize PostgreSQL connection using Drizzle ORM with node-postgres
   */
  private async initializePostgreSQL(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');

    const connectionConfig = typeof this.config.connection === 'string'
      ? { connectionString: this.config.connection }
      : this.config.connection;

    this.client = new Pool(connectionConfig);
    this.db = drizzle({ client: this.client });
  }

  /**
   * Initialize MySQL connection using Drizzle ORM with mysql2
   */
  private async initializeMySQL(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/mysql2');
    const mysql = await import('mysql2/promise');

    const connectionConfig = typeof this.config.connection === 'string'
      ? this.config.connection
      : this.config.connection;

    this.client = await mysql.createPool(connectionConfig);
    this.db = drizzle({ client: this.client });
  }

  /**
   * Initialize SQLite connection using Drizzle ORM with better-sqlite3
   */
  private async initializeSQLite(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const Database = await import('better-sqlite3');

    const url = typeof this.config.connection === 'string'
      ? this.config.connection
      : (this.config.connection as any).url;

    if (!url) {
      throw new Error('SQLite connection requires a url property');
    }

    this.client = new (Database.default || Database)(url);
    this.db = drizzle({ client: this.client });
  }

  /**
   * Execute a raw SQL query
   * @param sql - SQL query string
   * @param params - Query parameters
   * @returns Query result
   */
  async execute(sql: string, params?: unknown[]): Promise<unknown> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    // Use Drizzle's sql`` operator for raw queries
    const { sql: sqlOperator } = await import('drizzle-orm');
    
    // For now, execute raw SQL - this will be enhanced in future stories
    return this.db.execute(sqlOperator.raw(sql));
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.client) {
      if (this.vendor === 'postgresql' || this.vendor === 'mysql') {
        await this.client.end();
      } else if (this.vendor === 'sqlite') {
        this.client.close();
      }
      this.client = null;
      this.db = null;
    }
  }

  /**
   * Check if the connection is healthy
   * @returns true if connection is healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    if (!this.db || !this.client) {
      return false;
    }

    try {
      // Execute a simple query to check connection health
      await this.execute('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

