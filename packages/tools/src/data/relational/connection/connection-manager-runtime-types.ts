import type { DatabaseVendor } from '../types.js';
import type { ConnectionConfig } from './types.js';
import { ConnectionState, type ReconnectionConfig } from './lifecycle.js';

export type LoggerLike = {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
};

export type ConnectionPoolMetrics = {
  totalCount: number;
  activeCount: number;
  idleCount: number;
  waitingCount: number;
};

export type ConnectionManagerRuntime = {
  vendor: DatabaseVendor;
  config: ConnectionConfig;
  getState(): ConnectionState;
  setState(state: ConnectionState): void;
  getClient(): unknown;
  setClient(client: unknown): void;
  getDb(): unknown;
  setDb(db: unknown): void;
  emitConnected(): void;
  emitDisconnected(): void;
  emitError(error: Error): void;
  errorListenerCount(): number;
  getReconnectionConfig(): ReconnectionConfig;
  scheduleReconnection(): void;
  resetReconnectionAttempts(): void;
  getConnectionGeneration(): number;
  isHealthy(): Promise<boolean>;
};
