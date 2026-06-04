/**
 * Schema inspector for relational databases.
 * @module schema/schema-inspector
 */

import { createLogger } from '@agentforge/core';
import type { ConnectionManager } from '../connection/connection-manager.js';
import { executeQuery } from '../query/query-executor.js';
import type { DatabaseVendor } from '../types.js';
import { inspectMySQL } from './schema-inspector-mysql.js';
import { inspectPostgreSQL } from './schema-inspector-postgresql.js';
import {
  cloneSchema,
  filterSchemaTables,
  validateTableFilters,
  type QueryRow,
} from './schema-inspector-shared.js';
import { inspectSQLite } from './schema-inspector-sqlite.js';
import type {
  DatabaseSchema,
  SchemaInspectOptions,
  SchemaInspectorConfig,
  TableSchema,
} from './types.js';

const logger = createLogger('agentforge:tools:data:relational:schema-inspector');
const DEFAULT_CACHE_TTL_MS = 60_000;

interface CacheEntry {
  expiresAt: number;
  schema: DatabaseSchema;
}

const schemaCache = new Map<string, CacheEntry>();

/**
 * Inspects database schemas across PostgreSQL, MySQL, and SQLite.
 *
 * Retrieves table, column, index, and foreign key metadata with built-in
 * caching support. Use {@link SchemaInspector.clearCache} to invalidate
 * cached schemas.
 */
export class SchemaInspector {
  private readonly cacheTtlMs: number;
  private readonly cacheKey?: string;

  constructor(
    private readonly manager: ConnectionManager,
    private readonly vendor: DatabaseVendor,
    config?: SchemaInspectorConfig,
  ) {
    this.cacheTtlMs = config?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.cacheKey = config?.cacheKey;
  }

  static clearCache(cacheKey?: string): void {
    if (cacheKey) {
      schemaCache.delete(cacheKey);
      return;
    }

    schemaCache.clear();
  }

  invalidateCache(): void {
    SchemaInspector.clearCache(this.cacheKey);
  }

  async inspect(options?: SchemaInspectOptions): Promise<DatabaseSchema> {
    const tableFilters = validateTableFilters(options?.tables);
    const bypassCache = options?.bypassCache ?? false;

    if (!bypassCache && this.cacheKey) {
      const cached = schemaCache.get(this.cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.debug('Schema cache hit', { vendor: this.vendor });
        return filterSchemaTables(cloneSchema(cached.schema), tableFilters);
      }
    }

    const schema = await this.inspectFromDatabase();

    if (this.cacheKey && this.cacheTtlMs > 0) {
      schemaCache.set(this.cacheKey, {
        schema: cloneSchema(schema),
        expiresAt: Date.now() + this.cacheTtlMs,
      });
    }

    return filterSchemaTables(cloneSchema(schema), tableFilters);
  }

  private async inspectFromDatabase(): Promise<DatabaseSchema> {
    const tables = await this.inspectTables();

    return {
      vendor: this.vendor,
      tables: tables.sort((left, right) => {
        const leftKey = left.schema ? `${left.schema}.${left.name}` : left.name;
        const rightKey = right.schema ? `${right.schema}.${right.name}` : right.name;
        return leftKey.localeCompare(rightKey);
      }),
      generatedAt: new Date().toISOString(),
    };
  }

  private async inspectTables(): Promise<TableSchema[]> {
    switch (this.vendor) {
      case 'postgresql':
        return inspectPostgreSQL((query) => this.runQueryRows(query));
      case 'mysql':
        return inspectMySQL((query) => this.runQueryRows(query));
      case 'sqlite':
        return inspectSQLite((query) => this.runQueryRows(query));
      default:
        throw new Error(`Unsupported database vendor: ${String(this.vendor)}`);
    }
  }

  private async runQueryRows(query: string): Promise<QueryRow[]> {
    const result = await executeQuery(this.manager, {
      sql: query,
      vendor: this.vendor,
    });

    return result.rows as QueryRow[];
  }
}
