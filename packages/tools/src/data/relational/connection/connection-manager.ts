/**
 * Connection manager for relational databases using Drizzle ORM
 * @module connection/connection-manager
 */

import type { DatabaseConnection, DatabaseVendor } from '../types.js';
import type { ConnectionConfig } from './types.js';
import {
  cancelPendingReconnection,
  ConnectionState,
  scheduleReconnection,
  shutdownClient,
  waitForInFlightConnection,
  type ReconnectionConfig,
} from './lifecycle.js';
import {
  initializeVendorConnection,
  SAFE_INITIALIZATION_PATTERNS,
} from './vendor-initialization.js';
import { checkPeerDependency } from '../utils/peer-dependency-checker.js';
import { sql, type SQL } from 'drizzle-orm';
import { createLogger } from '@agentforge/core';
import { EventEmitter } from 'events';

const logger = createLogger('agentforge:tools:data:relational:connection');

/**
 * Connection lifecycle events
 */
export type ConnectionEvent = 'connected' | 'disconnected' | 'error' | 'reconnecting';
export { ConnectionState } from './lifecycle.js';
export type { ReconnectionConfig } from './lifecycle.js';

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
    this.reconnectionTimer = cancelPendingReconnection(
      this.reconnectionTimer,
      logger,
      this.vendor,
      'Clearing pending reconnection timer before manual connect'
    );

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
    this.reconnectionTimer = cancelPendingReconnection(
      this.reconnectionTimer,
      logger,
      this.vendor,
      'Clearing pending reconnection timer before disconnect'
    );

    // Reset reconnection attempts
    this.reconnectionAttempts = 0;

    // Wait for any in-flight connection attempt to complete before closing
    // This prevents race conditions where initialize() completes after disconnect()
    this.connectPromise = await waitForInFlightConnection(
      this.connectPromise,
      logger,
      this.vendor,
      'disconnect'
    );

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
   * Get the configured database vendor.
   */
  getVendor(): DatabaseVendor {
    return this.vendor;
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
      const initialized = await initializeVendorConnection(this.config);
      this.client = initialized.client;
      this.db = initialized.db;

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

      // Known validation errors (pool config, missing URL, unsupported vendor)
      // should surface their original message so callers can fix their input.
      const isValidationError = SAFE_INITIALIZATION_PATTERNS.some(
        (pattern) => normalizedError.message.includes(pattern)
      );
      if (isValidationError) {
        this.setState(ConnectionState.ERROR);
        throw normalizedError;
      }

      // Check if this is a cancellation error (disconnect() was called during initialization)
      const isCancellation = normalizedError.message.includes('Connection cancelled');

      // Only set error state and emit error event if this is NOT a cancellation
      // Cancellation errors already set state to DISCONNECTED before throwing
      if (!isCancellation) {
        // Set state to error and emit event.
        // Guard: only emit 'error' when there are listeners to avoid the
        // unhandled-error throw that Node.js EventEmitter enforces, which
        // would surface the raw driver error instead of our wrapped message.
        this.setState(ConnectionState.ERROR);
        if (this.listenerCount('error') > 0) {
          this.emit('error', normalizedError);
        }

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
    scheduleReconnection(
      {
        vendor: this.vendor,
        reconnectionConfig: this.reconnectionConfig,
        reconnectionAttempts: this.reconnectionAttempts,
        setReconnectionAttempts: (attempts) => {
          this.reconnectionAttempts = attempts;
        },
        setState: (state) => {
          this.setState(state);
        },
        emitReconnecting: (payload) => {
          this.emit('reconnecting', payload);
        },
        initialize: () => this.initialize(),
        setConnectPromise: (promise) => {
          this.connectPromise = promise;
        },
        setReconnectionTimer: (timer) => {
          this.reconnectionTimer = timer;
        },
      },
      logger
    );
  }

  /**
   * Determine whether an error thrown by drizzle-orm's better-sqlite3 adapter
   * `.all()` indicates the statement does not return data (i.e. it is DML/DDL,
   * not a SELECT).
   *
   * The adapter may surface this as either a native `SqliteError` or a
   * `TypeError` depending on the drizzle-orm / better-sqlite3 version, so we
   * accept both types while still requiring the distinctive message substring
   * to avoid false positives from unrelated errors.
   */
  private isSqliteNonQueryError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const isSqliteOrTypeError =
      error.constructor?.name === 'SqliteError' ||
      error.name === 'SqliteError' ||
      error instanceof TypeError;
    const hasNonQueryMessage = error.message.includes('does not return data');
    return isSqliteOrTypeError && hasNonQueryMessage;
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

    // drizzle-orm's better-sqlite3 adapter does not expose an .execute() method.
    // It uses .all() for SELECT (returns row arrays) and .run() for DML/DDL
    // (returns { changes, lastInsertRowid }). Try .all() first and fall back
    // to .run() when better-sqlite3 throws a SqliteError indicating the
    // statement does not return data.
    if (this.vendor === 'sqlite') {
      try {
        return this.db.all(query);
      } catch (error: unknown) {
        if (this.isSqliteNonQueryError(error)) {
          // .run() returns { changes, lastInsertRowid }. Normalize by mapping
          // `changes` to `affectedRows` so executeQuery() can derive rowCount
          // consistently across vendors.
          const runResult = this.db.run(query) as { changes?: number; lastInsertRowid?: number };
          return { ...runResult, affectedRows: runResult.changes ?? 0 };
        }
        throw error;
      }
    }

    // drizzle-orm's mysql2 adapter returns [rows, fields] from execute().
    // Normalize by extracting just the rows array so callers can treat the
    // result identically to PostgreSQL (which returns rows directly).
    if (this.vendor === 'mysql') {
      const raw = await this.db.execute(query);
      // mysql2 returns [rows, fields] for SELECTs and [ResultSetHeader, fields]
      // for INSERT/UPDATE/DELETE. Unwrap the first element in both cases so
      // callers get a consistent shape matching PostgreSQL / SQLite.
      if (Array.isArray(raw) && raw.length === 2) {
        return raw[0];
      }
      return raw;
    }

    return this.db.execute(query);
  }

  /**
   * Execute a callback with a single dedicated database connection/session.
   *
   * This is required for multi-statement transactions so all statements run on
   * the same underlying connection.
   */
  async executeInConnection<T>(
    callback: (execute: (query: SQL) => Promise<unknown>) => Promise<T>
  ): Promise<T> {
    if (!this.client || !this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }

    if (this.vendor === 'sqlite') {
      return callback(async (query) => {
        try {
          return this.db.all(query);
        } catch (error: unknown) {
          if (this.isSqliteNonQueryError(error)) {
            // Normalize .run() result — see execute() for details.
            const runResult = this.db.run(query) as { changes?: number; lastInsertRowid?: number };
            return { ...runResult, affectedRows: runResult.changes ?? 0 };
          }
          throw error;
        }
      });
    }

    if (this.vendor === 'postgresql') {
      const poolClient = await this.client.connect();
      try {
        const { drizzle } = await import('drizzle-orm/node-postgres');
        const sessionDb = drizzle({ client: poolClient });
        return await callback(async (query) => sessionDb.execute(query));
      } finally {
        poolClient.release();
      }
    }

    if (this.vendor === 'mysql') {
      const mysqlConnection = await this.client.getConnection();
      try {
        const { drizzle } = await import('drizzle-orm/mysql2');
        const sessionDb = drizzle({ client: mysqlConnection });
        return await callback(async (query) => {
          const raw = await sessionDb.execute(query);
          // mysql2 returns [rows, fields] for SELECTs and [ResultSetHeader, fields]
          // for INSERT/UPDATE/DELETE. Unwrap the first element in both cases.
          if (Array.isArray(raw) && raw.length === 2) {
            return raw[0];
          }
          return raw;
        });
      } finally {
        mysqlConnection.release();
      }
    }

    throw new Error(`Unsupported database vendor: ${this.vendor}`);
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
    this.reconnectionTimer = cancelPendingReconnection(
      this.reconnectionTimer,
      logger,
      this.vendor,
      'Canceling pending reconnection timer during close'
    );

    // Wait for any in-flight connection attempt to complete before closing
    this.connectPromise = await waitForInFlightConnection(
      this.connectPromise,
      logger,
      this.vendor,
      'close'
    );

    // Now perform the actual close operation
    if (this.client) {
      logger.info('Closing database connection', {
        vendor: this.vendor,
        state: this.state,
      });

      try {
        await shutdownClient(this.vendor, this.client);

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
      await shutdownClient(this.vendor, this.client);
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
