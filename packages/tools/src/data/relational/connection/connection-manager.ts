/**
 * Connection manager for relational databases using Drizzle ORM
 * @module connection/connection-manager
 */

import type { DatabaseConnection, DatabaseVendor } from '../types.js';
import type { ConnectionConfig, PoolConfig } from './types.js';
import { checkPeerDependency } from '../utils/peer-dependency-checker.js';
import { sql, type SQL } from 'drizzle-orm';
import { createLogger } from '@agentforge/core';
import { EventEmitter } from 'events';

const logger = createLogger('agentforge:tools:data:relational:connection');

/**
 * Connection state enum
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * Connection lifecycle events
 */
export type ConnectionEvent = 'connected' | 'disconnected' | 'error' | 'reconnecting';

/**
 * Reconnection configuration
 */
export interface ReconnectionConfig {
  /** Enable automatic reconnection on connection loss */
  enabled: boolean;
  /** Maximum number of reconnection attempts (0 = infinite) */
  maxAttempts: number;
  /** Base delay in milliseconds for exponential backoff */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between reconnection attempts */
  maxDelayMs: number;
}

/**
 * Validate pool configuration
 * @param poolConfig - Pool configuration to validate
 * @throws {Error} If pool configuration is invalid
 */
function validatePoolConfig(poolConfig: PoolConfig): void {
  if (poolConfig.max !== undefined && poolConfig.max < 1) {
    throw new Error('Pool max connections must be >= 1');
  }

  if (poolConfig.acquireTimeoutMillis !== undefined && poolConfig.acquireTimeoutMillis < 0) {
    throw new Error('Pool acquire timeout must be >= 0');
  }

  if (poolConfig.idleTimeoutMillis !== undefined && poolConfig.idleTimeoutMillis < 0) {
    throw new Error('Pool idle timeout must be >= 0');
  }
}

/**
 * Connection manager that handles database connections for PostgreSQL, MySQL, and SQLite
 * using Drizzle ORM with lifecycle management and automatic reconnection
 */
export class ConnectionManager extends EventEmitter implements DatabaseConnection {
  private vendor: DatabaseVendor;
  private db: any; // Drizzle database instance
  private client: any; // Underlying database client (pg.Pool, mysql2.Pool, or better-sqlite3.Database)
  private config: ConnectionConfig;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectionConfig: ReconnectionConfig;
  private reconnectionAttempts = 0;
  private reconnectionTimer: NodeJS.Timeout | null = null;
  private connectPromise: Promise<void> | null = null; // Track in-flight connection attempts
  private connectionGeneration = 0; // Cancellation token for disconnect

  /**
   * Create a new ConnectionManager instance
   * @param config - Connection configuration
   * @param reconnectionConfig - Optional reconnection configuration
   */
  constructor(
    config: ConnectionConfig,
    reconnectionConfig?: Partial<ReconnectionConfig>
  ) {
    super();
    this.config = config;
    this.vendor = config.vendor;

    // Default reconnection configuration
    this.reconnectionConfig = {
      enabled: reconnectionConfig?.enabled ?? false,
      maxAttempts: reconnectionConfig?.maxAttempts ?? 5,
      baseDelayMs: reconnectionConfig?.baseDelayMs ?? 1000,
      maxDelayMs: reconnectionConfig?.maxDelayMs ?? 30000,
    };

    // Check for required peer dependency before attempting connection
    checkPeerDependency(this.vendor);
  }

  /**
   * Connect to the database
   * Initializes the connection and sets up automatic reconnection if configured
   * @throws {Error} If connection fails or configuration is invalid
   */
  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED) {
      logger.debug('Already connected', { vendor: this.vendor });
      return;
    }

    // If a connection is already in progress, wait for it to complete
    // This handles both manual connect() calls and automatic reconnection attempts
    if (this.connectPromise) {
      logger.debug('Connection already in progress, waiting for completion', {
        vendor: this.vendor,
        state: this.state,
      });
      return this.connectPromise;
    }

    // If a reconnection has been scheduled, cancel it before starting a new connection attempt
    if (this.reconnectionTimer) {
      logger.debug('Clearing pending reconnection timer before manual connect', {
        vendor: this.vendor,
      });
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    // Track the connection promise so concurrent callers can await it
    this.connectPromise = this.initialize().finally(() => {
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  /**
   * Disconnect from the database
   * Closes the connection and cancels any pending reconnection attempts
   *
   * Note: Event listeners are NOT removed by this method. If you need to dispose
   * of the ConnectionManager instance entirely, call dispose() instead.
   */
  async disconnect(): Promise<void> {
    // Increment generation to cancel any in-flight initialize() operations
    this.connectionGeneration++;

    // Cancel any pending reconnection
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    // Reset reconnection attempts
    this.reconnectionAttempts = 0;

    // Wait for any in-flight connection attempt to complete before closing
    // This prevents race conditions where initialize() completes after disconnect()
    if (this.connectPromise) {
      logger.debug('Waiting for in-flight connection attempt to complete before disconnect', {
        vendor: this.vendor,
      });
      try {
        await this.connectPromise;
      } catch {
        // Ignore errors from the connection attempt - we're disconnecting anyway
      }
      // Clear the promise reference
      this.connectPromise = null;
    }

    // Close the connection
    await this.close();
  }

  /**
   * Dispose of the ConnectionManager instance
   * Disconnects and removes all event listeners
   * Call this when you're done with the ConnectionManager and won't reuse it
   */
  async dispose(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
  }

  /**
   * Check if the connection is currently connected
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED;
  }

  /**
   * Get the current connection state
   * @returns Current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * Initialize the database connection
   *
   * This method is public to maintain compatibility with the DatabaseConnection interface
   * and existing code (e.g., relational-query.ts). For new code, prefer using connect()
   * which provides lifecycle management and automatic reconnection.
   *
   * @throws {Error} If connection fails or configuration is invalid
   */
  async initialize(): Promise<void> {
    const startTime = Date.now();
    const currentGeneration = this.connectionGeneration;

    // Guard: if already connected, clean up existing resources first to prevent leaks
    if (this.state === ConnectionState.CONNECTED && this.client) {
      logger.warn('Re-initializing an already connected manager; emitting disconnected before cleanup', {
        vendor: this.vendor,
      });
      // Ensure listeners see a full lifecycle: connected -> disconnected -> connected
      this.setState(ConnectionState.DISCONNECTED);
      this.emit('disconnected');
      await this.cleanupCancelledConnection();
    }

    // Set state to connecting
    this.setState(ConnectionState.CONNECTING);

    logger.info('Initializing database connection', {
      vendor: this.vendor,
      connectionType: typeof this.config.connection,
      state: this.state,
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

      // Check if disconnect() was called during initialization
      if (currentGeneration !== this.connectionGeneration) {
        logger.debug('Connection cancelled during initialization', {
          vendor: this.vendor,
          currentGeneration,
          newGeneration: this.connectionGeneration,
        });
        // Clean up resources before throwing
        await this.cleanupCancelledConnection();
        // Set state to disconnected since we're cancelling
        this.setState(ConnectionState.DISCONNECTED);
        throw new Error('Connection cancelled during initialization');
      }

      // Validate connection after initialization
      logger.debug('Validating connection health', { vendor: this.vendor });
      const healthy = await this.isHealthy();
      if (!healthy) {
        throw new Error(`Failed to establish healthy connection to ${this.vendor} database`);
      }

      // Check again after async health check
      if (currentGeneration !== this.connectionGeneration) {
        logger.debug('Connection cancelled during health check', {
          vendor: this.vendor,
          currentGeneration,
          newGeneration: this.connectionGeneration,
        });
        // Clean up resources before throwing
        await this.cleanupCancelledConnection();
        // Set state to disconnected since we're cancelling
        this.setState(ConnectionState.DISCONNECTED);
        throw new Error('Connection cancelled during health check');
      }

      // Set state to connected and emit event
      this.setState(ConnectionState.CONNECTED);
      this.emit('connected');

      // Reset reconnection attempts on successful connection
      this.reconnectionAttempts = 0;

      logger.info('Database connection initialized successfully', {
        vendor: this.vendor,
        duration: Date.now() - startTime,
        state: this.state,
      });
    } catch (error) {
      const errorMessage = `Failed to initialize ${this.vendor} connection`;

      // Normalize error to Error object before emitting
      const normalizedError = error instanceof Error ? error : new Error(String(error));

      // Check if this is a cancellation error (disconnect() was called during initialization)
      const isCancellation = normalizedError.message.includes('Connection cancelled');

      // Only set error state and emit error event if this is NOT a cancellation
      // Cancellation errors already set state to DISCONNECTED before throwing
      if (!isCancellation) {
        // Set state to error and emit event
        this.setState(ConnectionState.ERROR);
        this.emit('error', normalizedError);

        logger.error(errorMessage, {
          vendor: this.vendor,
          error: normalizedError.message,
          duration: Date.now() - startTime,
          state: this.state,
        });

        // Clean up any partially created resources to prevent connection leaks
        await this.cleanupCancelledConnection();

        // Attempt reconnection if configured and this initialize call is still current
        // This prevents scheduling reconnection after disconnect() has been called
        if (this.reconnectionConfig.enabled && currentGeneration === this.connectionGeneration) {
          this.scheduleReconnection();
        }
      } else {
        // For cancellation, just log debug info - state is already DISCONNECTED
        logger.debug('Connection initialization cancelled', {
          vendor: this.vendor,
          duration: Date.now() - startTime,
          state: this.state,
        });
      }

      if (error instanceof Error) {
        throw new Error(errorMessage, { cause: error });
      }
      throw new Error(`${errorMessage}: ${String(error)}`);
    }
  }

  /**
   * Set the connection state and log the change
   * @param newState - New connection state
   * @private
   */
  private setState(newState: ConnectionState): void {
    const oldState = this.state;
    this.state = newState;

    if (oldState !== newState) {
      logger.debug('Connection state changed', {
        vendor: this.vendor,
        oldState,
        newState,
      });
    }
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   * @private
   */
  private scheduleReconnection(): void {
    // Check if we've exceeded max attempts
    if (
      this.reconnectionConfig.maxAttempts > 0 &&
      this.reconnectionAttempts >= this.reconnectionConfig.maxAttempts
    ) {
      logger.error('Max reconnection attempts reached', {
        vendor: this.vendor,
        attempts: this.reconnectionAttempts,
        maxAttempts: this.reconnectionConfig.maxAttempts,
      });
      return;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.reconnectionConfig.baseDelayMs * Math.pow(2, this.reconnectionAttempts),
      this.reconnectionConfig.maxDelayMs
    );

    this.reconnectionAttempts++;

    // Set state to reconnecting
    this.setState(ConnectionState.RECONNECTING);

    logger.info('Scheduling reconnection attempt', {
      vendor: this.vendor,
      attempt: this.reconnectionAttempts,
      maxAttempts: this.reconnectionConfig.maxAttempts,
      delayMs: delay,
    });

    this.emit('reconnecting', {
      attempt: this.reconnectionAttempts,
      maxAttempts: this.reconnectionConfig.maxAttempts,
      delayMs: delay,
    });

    // Schedule reconnection
    this.reconnectionTimer = setTimeout(async () => {
      this.reconnectionTimer = null;

      try {
        logger.info('Attempting reconnection', {
          vendor: this.vendor,
          attempt: this.reconnectionAttempts,
        });

        // Track the reconnection promise so concurrent connect() calls can await it
        this.connectPromise = this.initialize().finally(() => {
          this.connectPromise = null;
        });

        await this.connectPromise;
      } catch (error) {
        logger.error('Reconnection attempt failed', {
          vendor: this.vendor,
          attempt: this.reconnectionAttempts,
          error: error instanceof Error ? error.message : String(error),
        });

        // The initialize() method will schedule another reconnection if needed
      }
    }, delay);
  }

  /**
   * Initialize PostgreSQL connection using Drizzle ORM with node-postgres
   *
   * Applies pool configuration options to pg.Pool for connection management.
   */
  private async initializePostgreSQL(): Promise<void> {
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const { Pool } = await import('pg');

    // Extract pool config and base config separately to avoid passing unknown 'pool' property to pg.Pool
    const { pool: poolConfig, ...baseConfig } = typeof this.config.connection === 'string'
      ? { connectionString: this.config.connection }
      : this.config.connection;

    // Validate pool configuration
    if (poolConfig) {
      validatePoolConfig(poolConfig);
    }

    const connectionConfig = {
      ...baseConfig,
      // Map our PoolConfig to pg.Pool options
      // Note: pg.Pool does not support a `min` option
      ...(poolConfig?.max !== undefined && { max: poolConfig.max }),
      ...(poolConfig?.idleTimeoutMillis !== undefined && { idleTimeoutMillis: poolConfig.idleTimeoutMillis }),
      ...(poolConfig?.acquireTimeoutMillis !== undefined && { connectionTimeoutMillis: poolConfig.acquireTimeoutMillis }),
    };

    logger.debug('Creating PostgreSQL connection pool', {
      vendor: this.vendor,
      poolConfig: {
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
      // Destructure to separate pool config from mysql2 config
      const { pool: poolConfig, ...baseConfig } = this.config.connection;

      // Validate pool configuration
      if (poolConfig) {
        validatePoolConfig(poolConfig);
      }

      connectionConfig = {
        ...baseConfig,
        // Map our PoolConfig to mysql2 pool options
        ...(poolConfig?.max !== undefined && { connectionLimit: poolConfig.max }),
        ...(poolConfig?.acquireTimeoutMillis !== undefined && { acquireTimeout: poolConfig.acquireTimeoutMillis }),
        ...(poolConfig?.idleTimeoutMillis !== undefined && { idleTimeout: poolConfig.idleTimeoutMillis }),
      };

      logger.debug('Creating MySQL connection pool', {
        vendor: this.vendor,
        poolConfig: {
          connectionLimit: connectionConfig.connectionLimit,
          acquireTimeout: connectionConfig.acquireTimeout,
          idleTimeout: connectionConfig.idleTimeout,
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

    // Validate and log pool config if provided (for awareness, but SQLite doesn't use traditional pooling)
    if (typeof this.config.connection === 'object' && this.config.connection.pool) {
      validatePoolConfig(this.config.connection.pool);
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
   * Execute a SQL query
   *
   * Executes a parameterized SQL query using Drizzle's SQL template objects.
   * This method provides safe parameter binding to prevent SQL injection.
   *
   * @param query - Drizzle SQL template object with parameter binding
   * @returns Query result
   *
   * @example
   * ```typescript
   * import { sql } from 'drizzle-orm';
   *
   * const result = await manager.execute(
   *   sql`SELECT * FROM users WHERE id = ${userId}`
   * );
   * ```
   */
  async execute(query: SQL): Promise<unknown> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    logger.debug('Executing SQL query', {
      vendor: this.vendor
    });

    return this.db.execute(query);
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
    activeCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    if (!this.client) {
      return { totalCount: 0, activeCount: 0, idleCount: 0, waitingCount: 0 };
    }

    if (this.vendor === 'postgresql') {
      // pg.Pool provides these properties via public API
      const totalCount = this.client.totalCount || 0;
      const idleCount = this.client.idleCount || 0;
      const waitingCount = this.client.waitingCount || 0;
      const activeCount = Math.max(totalCount - idleCount, 0);

      return {
        totalCount,
        activeCount,
        idleCount,
        waitingCount,
      };
    } else if (this.vendor === 'mysql') {
      // mysql2 does not expose a stable public API for pool metrics.
      // To avoid relying on private/internal fields (e.g. _allConnections),
      // we return neutral metrics here and treat MySQL pool stats as unavailable.
      return {
        totalCount: 0,
        activeCount: 0,
        idleCount: 0,
        waitingCount: 0,
      };
    } else {
      // SQLite uses a single connection
      const totalCount = this.client.open ? 1 : 0;
      const idleCount = 0;
      const waitingCount = 0;
      const activeCount = this.client.open ? 1 : 0;

      return {
        totalCount,
        activeCount,
        idleCount,
        waitingCount,
      };
    }
  }

  /**
   * Close the database connection
   *
   * This method is public to maintain compatibility with the DatabaseConnection interface
   * and existing code (e.g., relational-query.ts). For new code, prefer using disconnect()
   * for connection lifecycle management. Note that disconnect() does NOT clean up event
   * listeners; call dispose() if you need full cleanup including listener removal.
   *
   * Note: This method coordinates with in-flight connect()/initialize() operations
   * and cancels pending reconnection timers to prevent unexpected reconnections.
   */
  async close(): Promise<void> {
    // Increment generation to cancel any in-flight initialize() operations
    this.connectionGeneration++;

    // Cancel any pending reconnection to prevent unexpected reconnection after close
    if (this.reconnectionTimer) {
      logger.debug('Canceling pending reconnection timer during close', {
        vendor: this.vendor,
      });
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    // Wait for any in-flight connection attempt to complete before closing
    if (this.connectPromise) {
      logger.debug('Waiting for in-flight connection attempt to complete before close', {
        vendor: this.vendor,
      });
      try {
        await this.connectPromise;
      } catch {
        // Ignore errors from the connection attempt - we're closing anyway
      }
      this.connectPromise = null;
    }

    // Now perform the actual close operation
    if (this.client) {
      logger.info('Closing database connection', {
        vendor: this.vendor,
        state: this.state,
      });

      try {
        if (this.vendor === 'postgresql' || this.vendor === 'mysql') {
          await this.client.end();
        } else if (this.vendor === 'sqlite') {
          this.client.close();
        }

        // Set state to disconnected and emit event
        this.setState(ConnectionState.DISCONNECTED);
        this.emit('disconnected');

        logger.debug('Database connection closed successfully', {
          vendor: this.vendor,
          state: this.state,
        });
      } catch (error) {
        logger.error('Error closing database connection', {
          vendor: this.vendor,
          error: error instanceof Error ? error.message : String(error),
          state: this.state,
        });

        // Normalize error to Error object before emitting
        const normalizedError = error instanceof Error ? error : new Error(String(error));

        // Set state to error even if close fails
        this.setState(ConnectionState.ERROR);
        this.emit('error', normalizedError);

        // Don't re-throw - we still want to clean up state
      } finally {
        this.client = null;
        this.db = null;
      }
    } else if (this.state !== ConnectionState.DISCONNECTED) {
      // No client but not disconnected - set state
      this.setState(ConnectionState.DISCONNECTED);
      this.emit('disconnected');
    }
  }

  /**
   * Clean up resources when a connection is cancelled during initialization
   * This prevents connection leaks when disconnect() is called while initialize() is in-flight
   */
  private async cleanupCancelledConnection(): Promise<void> {
    if (!this.client) {
      return;
    }

    logger.debug('Cleaning up cancelled connection', {
      vendor: this.vendor,
    });

    try {
      // Close the client connection
      if (this.vendor === 'postgresql' || this.vendor === 'mysql') {
        await this.client.end();
      } else if (this.vendor === 'sqlite') {
        this.client.close();
      }
    } catch (error) {
      // Log but don't throw - we're cleaning up a cancelled connection
      logger.debug('Error during cancelled connection cleanup', {
        vendor: this.vendor,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      // Always clear the references
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
      logger.debug('Health check failed: connection not initialized', { vendor: this.vendor });
      return false;
    }

    try {
      // Execute a simple query to check connection health
      await this.execute(sql`SELECT 1`);
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

