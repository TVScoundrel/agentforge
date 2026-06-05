import { createLogger } from '@agentforge/core';
import { sql, type SQL } from 'drizzle-orm';
import type { DatabaseVendor } from '../types.js';
import { toSqlIsolationLevel } from './transaction-options.js';
import type { ResolvedTransactionOptions, TransactionContext } from './transaction-types.js';

const logger = createLogger('agentforge:tools:data:relational:transaction');
const SAVEPOINT_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export class ManagedTransaction implements TransactionContext {
  public readonly id: string;
  public readonly vendor: DatabaseVendor;
  private readonly options: ResolvedTransactionOptions;
  private readonly executeQuery: (query: SQL) => Promise<unknown>;
  private completed = false;
  private cancelledReason: string | null = null;
  private savepointCounter = 0;
  private sqliteReadUncommittedOriginal: 0 | 1 | null = null;
  private shouldRestoreSqliteReadUncommitted = false;

  constructor(args: {
    id: string;
    vendor: DatabaseVendor;
    executeQuery: (query: SQL) => Promise<unknown>;
    options: ResolvedTransactionOptions;
  }) {
    this.id = args.id;
    this.vendor = args.vendor;
    this.executeQuery = args.executeQuery;
    this.options = args.options;
  }

  isActive(): boolean {
    return !this.completed;
  }

  async execute(query: SQL): Promise<unknown> {
    if (this.cancelledReason) {
      throw new Error(this.cancelledReason);
    }

    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    return this.executeQuery(query);
  }

  async begin(): Promise<void> {
    if (this.vendor === 'mysql') {
      await this.applyIsolationLevel();
      await this.executeQuery(sql.raw('BEGIN'));
      return;
    }

    await this.executeQuery(sql.raw('BEGIN'));
    await this.applyIsolationLevel();
  }

  cancel(reason: string): void {
    if (!this.cancelledReason) {
      this.cancelledReason = reason;
    }
  }

  async commit(): Promise<void> {
    if (!this.isActive()) {
      return;
    }

    await this.executeQuery(sql.raw('COMMIT'));
    await this.restoreSqliteIsolationIfNeeded();
    this.completed = true;
  }

  async rollback(): Promise<void> {
    if (!this.isActive()) {
      return;
    }

    await this.executeQuery(sql.raw('ROLLBACK'));
    await this.restoreSqliteIsolationIfNeeded();
    this.completed = true;
  }

  async createSavepoint(name?: string): Promise<string> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = this.normalizeSavepointName(name ?? `sp_${++this.savepointCounter}`);
    await this.executeQuery(sql.raw(`SAVEPOINT ${savepointName}`));
    return savepointName;
  }

  async rollbackToSavepoint(name: string): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = this.normalizeSavepointName(name);
    await this.executeQuery(sql.raw(`ROLLBACK TO SAVEPOINT ${savepointName}`));
  }

  async releaseSavepoint(name: string): Promise<void> {
    if (!this.isActive()) {
      throw new Error('Transaction is no longer active');
    }

    const savepointName = this.normalizeSavepointName(name);
    await this.executeQuery(sql.raw(`RELEASE SAVEPOINT ${savepointName}`));
  }

  async withSavepoint<T>(
    operation: (transaction: TransactionContext) => Promise<T>,
    name?: string
  ): Promise<T> {
    const savepointName = await this.createSavepoint(name);

    try {
      const result = await operation(this);
      await this.releaseSavepoint(savepointName);
      return result;
    } catch (error) {
      await this.rollbackToSavepoint(savepointName);
      try {
        await this.releaseSavepoint(savepointName);
      } catch {
        // Ignore release errors after rollback-to-savepoint.
      }
      throw error;
    }
  }

  private async applyIsolationLevel(): Promise<void> {
    if (!this.options.isolationLevel) {
      return;
    }

    const isolationSql = toSqlIsolationLevel(this.options.isolationLevel);

    if (this.vendor === 'sqlite') {
      if (this.options.isolationLevel === 'read uncommitted') {
        this.sqliteReadUncommittedOriginal = await this.getSqliteReadUncommittedState();
        await this.executeQuery(sql.raw('PRAGMA read_uncommitted = 1'));
        this.shouldRestoreSqliteReadUncommitted = true;
      } else {
        logger.debug('Ignoring SQLite isolation level override', {
          transactionId: this.id,
          isolationLevel: this.options.isolationLevel,
        });
      }
      return;
    }

    await this.executeQuery(sql.raw(`SET TRANSACTION ISOLATION LEVEL ${isolationSql}`));
  }

  private normalizeSavepointName(name: string): string {
    if (!SAVEPOINT_NAME_PATTERN.test(name)) {
      throw new Error(
        'Invalid savepoint name. Use only letters, numbers, and underscores, and start with a letter or underscore.'
      );
    }

    return name;
  }

  private async restoreSqliteIsolationIfNeeded(): Promise<void> {
    if (!this.shouldRestoreSqliteReadUncommitted) {
      return;
    }

    try {
      const targetValue = this.sqliteReadUncommittedOriginal ?? 0;
      await this.executeQuery(sql.raw(`PRAGMA read_uncommitted = ${targetValue}`));
    } catch (error) {
      logger.warn('Failed to restore SQLite read_uncommitted pragma', {
        transactionId: this.id,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.shouldRestoreSqliteReadUncommitted = false;
    }
  }

  private async getSqliteReadUncommittedState(): Promise<0 | 1 | null> {
    try {
      const result = await this.executeQuery(sql.raw('PRAGMA read_uncommitted'));
      const rows = Array.isArray(result)
        ? result
        : ((result as { rows?: unknown[] }).rows ?? []);

      const first = rows[0];
      if (first && typeof first === 'object') {
        const value = (first as Record<string, unknown>).read_uncommitted;
        if (typeof value === 'number') {
          return value === 1 ? 1 : 0;
        }
      }
    } catch {
      // If introspection fails, we'll restore to default (0) in finalize path.
    }

    return null;
  }
}
