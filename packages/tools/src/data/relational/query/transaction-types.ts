import type { DatabaseVendor } from '../types.js';
import type { SqlExecutor } from './types.js';

export type TransactionIsolationLevel =
  | 'read uncommitted'
  | 'read committed'
  | 'repeatable read'
  | 'serializable';

export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeoutMs?: number;
}

export interface ResolvedTransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeoutMs?: number;
}

export interface TransactionContext extends SqlExecutor {
  id: string;
  vendor: DatabaseVendor;
  isActive(): boolean;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  createSavepoint(name?: string): Promise<string>;
  rollbackToSavepoint(name: string): Promise<void>;
  releaseSavepoint(name: string): Promise<void>;
  withSavepoint<T>(operation: (transaction: TransactionContext) => Promise<T>, name?: string): Promise<T>;
}
