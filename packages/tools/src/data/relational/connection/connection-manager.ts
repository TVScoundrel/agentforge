import type { DatabaseConnection, DatabaseVendor } from '../types.js';
import type { ConnectionConfig } from './types.js';
import {
  cancelPendingReconnection,
  ConnectionState,
  scheduleReconnection as scheduleReconnectionHelper,
  waitForInFlightConnection,
  type ReconnectionConfig,
} from './lifecycle.js';
import {
  checkConnectionHealth,
  closeManagedConnection,
  getConnectionPoolMetrics,
  initializeManagedConnection,
  isSqliteNonQueryError,
} from './connection-manager-runtime.js';
import { executeQuery } from './query-execution.js';
import { executeInDedicatedConnection } from './session-adapters.js';
import { checkPeerDependency } from '../utils/peer-dependency-checker.js';
import type { SQL } from 'drizzle-orm';
import { createLogger } from '@agentforge/core';
import { EventEmitter } from 'events';

const logger = createLogger('agentforge:tools:data:relational:connection');

export type ConnectionEvent = 'connected' | 'disconnected' | 'error' | 'reconnecting';
export { ConnectionState } from './lifecycle.js';
export type { ReconnectionConfig } from './lifecycle.js';

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

  constructor(config: ConnectionConfig, reconnectionConfig?: Partial<ReconnectionConfig>) {
    super();
    this.config = config;
    this.vendor = config.vendor;
    this.reconnectionConfig = {
      enabled: reconnectionConfig?.enabled ?? false,
      maxAttempts: reconnectionConfig?.maxAttempts ?? 5,
      baseDelayMs: reconnectionConfig?.baseDelayMs ?? 1000,
      maxDelayMs: reconnectionConfig?.maxDelayMs ?? 30000,
    };
    checkPeerDependency(this.vendor);
  }

  async connect(): Promise<void> {
    if (this.state === ConnectionState.CONNECTED) {
      logger.debug('Already connected', { vendor: this.vendor });
      return;
    }
    if (this.connectPromise) {
      logger.debug('Connection already in progress, waiting for completion', {
        vendor: this.vendor,
        state: this.state,
      });
      return this.connectPromise;
    }
    this.reconnectionTimer = cancelPendingReconnection(
      this.reconnectionTimer,
      logger,
      this.vendor,
      'Clearing pending reconnection timer before manual connect'
    );
    this.connectPromise = this.initialize().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  async disconnect(): Promise<void> {
    this.connectionGeneration++;
    this.reconnectionTimer = cancelPendingReconnection(
      this.reconnectionTimer,
      logger,
      this.vendor,
      'Clearing pending reconnection timer before disconnect'
    );
    this.reconnectionAttempts = 0;
    this.connectPromise = await waitForInFlightConnection(
      this.connectPromise,
      logger,
      this.vendor,
      'disconnect'
    );
    await this.close();
  }

  async dispose(): Promise<void> {
    await this.disconnect();
    this.removeAllListeners();
  }

  isConnected(): boolean { return this.state === ConnectionState.CONNECTED; }
  getState(): ConnectionState { return this.state; }
  getVendor(): DatabaseVendor { return this.vendor; }

  async initialize(): Promise<void> {
    return initializeManagedConnection(this.createRuntimeAdapter(), logger);
  }

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

  private scheduleReconnection(): void {
    scheduleReconnectionHelper(
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

  private createRuntimeAdapter() {
    return {
      vendor: this.vendor,
      config: this.config,
      getState: () => this.state,
      setState: (state: ConnectionState) => this.setState(state),
      getClient: () => this.client,
      setClient: (client: unknown) => { this.client = client; },
      getDb: () => this.db,
      setDb: (db: unknown) => { this.db = db; },
      emitConnected: () => { this.emit('connected'); },
      emitDisconnected: () => { this.emit('disconnected'); },
      emitError: (error: Error) => { this.emit('error', error); },
      errorListenerCount: () => this.listenerCount('error'),
      getReconnectionConfig: () => this.reconnectionConfig,
      scheduleReconnection: () => this.scheduleReconnection(),
      resetReconnectionAttempts: () => { this.reconnectionAttempts = 0; },
      getConnectionGeneration: () => this.connectionGeneration,
      isHealthy: () => this.isHealthy(),
    };
  }

  async execute(query: SQL): Promise<unknown> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    return executeQuery(
      {
        vendor: this.vendor,
        db: this.db,
        isSqliteNonQueryError,
      },
      query,
      logger
    );
  }

  async executeInConnection<T>(
    callback: (execute: (query: SQL) => Promise<unknown>) => Promise<T>
  ): Promise<T> {
    if (!this.client || !this.db) {
      throw new Error('Database not initialized. Call connect() first.');
    }

    return executeInDedicatedConnection(
      {
        vendor: this.vendor,
        client: this.client,
        db: this.db,
        isSqliteNonQueryError,
      },
      callback
    );
  }

  getPoolMetrics(): {
    totalCount: number;
    activeCount: number;
    idleCount: number;
    waitingCount: number;
  } {
    return getConnectionPoolMetrics(this.vendor, this.client);
  }

  async close(): Promise<void> {
    this.connectionGeneration++;
    this.reconnectionTimer = cancelPendingReconnection(
      this.reconnectionTimer,
      logger,
      this.vendor,
      'Canceling pending reconnection timer during close'
    );
    this.connectPromise = await waitForInFlightConnection(
      this.connectPromise,
      logger,
      this.vendor,
      'close'
    );
    await closeManagedConnection(
      {
        vendor: this.vendor,
        getState: () => this.state,
        setState: (state) => this.setState(state),
        getClient: () => this.client,
        setClient: (client) => { this.client = client; },
        setDb: (db) => { this.db = db; },
        emitDisconnected: () => { this.emit('disconnected'); },
        emitError: (error) => { this.emit('error', error); },
      },
      logger
    );
  }

  async isHealthy(): Promise<boolean> {
    return checkConnectionHealth(
      {
        vendor: this.vendor,
        db: this.db,
        client: this.client,
        execute: (query) => this.execute(query),
      },
      logger
    );
  }
}
