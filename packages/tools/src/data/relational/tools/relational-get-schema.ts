/**
 * Relational Get Schema Tool
 * @module tools/relational-get-schema
 */

import { z } from 'zod';
import { createLogger, toolBuilder, ToolCategory } from '@agentforge/core';
import { createHash } from 'node:crypto';
import { ConnectionManager } from '../connection/connection-manager.js';
import { SchemaInspector } from '../schema/schema-inspector.js';
import type { DatabaseSchema } from '../schema/types.js';
import { VALID_TABLE_FILTER_PATTERN } from '../schema/validation.js';
import type { DatabaseVendor } from '../types.js';
import { isSafeGetSchemaValidationError } from './relational-get-schema-error-utils.js';
import type { RelationalReadExecution } from './read-execution.js';
const logger = createLogger('agentforge:tools:data:relational:get-schema');

function buildSchemaCacheKey(vendor: DatabaseVendor, connectionString: string, database?: string): string {
  const databaseScope = database ?? 'default';
  const connectionHash = createHash('sha256')
    .update(connectionString)
    .digest('hex');
  return `${vendor}:${databaseScope}:${connectionHash}`;
}

/**
 * Zod schema for relational-get-schema input.
 */
export const relationalGetSchemaInputSchema = z.object({
  vendor: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database vendor'),
  connectionString: z
    .string()
    .min(1, 'Database connection string is required')
    .describe('Database connection string used to create a new connection'),
  database: z
    .string()
    .min(1)
    .optional()
    .describe('Optional logical database name used for cache scoping'),
  tables: z
    .array(
      z
        .string()
        .regex(
          VALID_TABLE_FILTER_PATTERN,
          'Table filter contains invalid characters. Use alphanumeric, underscore, and optional schema qualification.',
        ),
    )
    .optional()
    .describe('Optional table filter list. When omitted, all tables are returned.'),
  cacheTtlMs: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Schema cache TTL in milliseconds (0 disables caching)'),
  refreshCache: z
    .boolean()
    .optional()
    .describe('Force cache invalidation before introspecting schema'),
});

export type RelationalGetSchemaInput = z.input<typeof relationalGetSchemaInputSchema>;
export type RelationalGetSchemaOperationInput = Omit<
  RelationalGetSchemaInput,
  'vendor' | 'connectionString'
>;

interface SchemaSummary {
  tableCount: number;
  columnCount: number;
  foreignKeyCount: number;
  indexCount: number;
}

export type GetSchemaResponse =
  | { success: true; schema: DatabaseSchema; summary: SchemaSummary }
  | { success: false; error: string; schema: null };

function toGetSchemaErrorResponse(
  execution: RelationalReadExecution,
  input: RelationalGetSchemaOperationInput,
  error: unknown,
): GetSchemaResponse {
  logger.error('Schema introspection failed', {
    vendor: execution.vendor,
    hasTablesFilter: Array.isArray(input.tables),
    tablesFilterCount: input.tables?.length ?? 0,
    refreshCache: input.refreshCache ?? false,
    error: error instanceof Error ? error.message : String(error),
  });

  const errorMessage = isSafeGetSchemaValidationError(error)
    ? error.message
    : 'Failed to inspect schema. See logs for details.';

  return {
    success: false,
    error: errorMessage,
    schema: null,
  };
}

/** Inspect schema through a session and optional cache owned by the caller. */
export async function invokeRelationalGetSchema(
  execution: RelationalReadExecution,
  input: RelationalGetSchemaOperationInput,
): Promise<GetSchemaResponse> {
  const cacheKey = execution.schemaCacheKey
    ?? (execution.schemaCache ? input.database ?? 'default' : undefined);
  const inspector = new SchemaInspector(
    execution.transaction ?? execution.executor,
    execution.vendor,
    {
      cacheTtlMs: input.cacheTtlMs,
      cacheKey,
      cache: execution.schemaCache,
    },
  );

  try {
    if (input.refreshCache && cacheKey) {
      inspector.invalidateCache();
    }

    const schema = await inspector.inspect(
      execution.transaction
        ? { tables: input.tables, bypassCache: true }
        : { tables: input.tables },
    );

    const summary = schema.tables.reduce<SchemaSummary>(
      (accumulator, table) => {
        accumulator.tableCount += 1;
        accumulator.columnCount += table.columns.length;
        accumulator.foreignKeyCount += table.foreignKeys.length;
        accumulator.indexCount += table.indexes.length;
        return accumulator;
      },
      { tableCount: 0, columnCount: 0, foreignKeyCount: 0, indexCount: 0 },
    );

    return { success: true, schema, summary };
  } catch (error) {
    return toGetSchemaErrorResponse(execution, input, error);
  }
}

/**
 * Relational Get Schema Tool
 *
 * Introspects database schema metadata including tables, columns, primary keys,
 * foreign keys, and indexes for PostgreSQL, MySQL, and SQLite.
 */
export const relationalGetSchema = toolBuilder()
  .name('relational-get-schema')
  .displayName('Relational Get Schema')
  .description('Inspect relational database schema (tables, columns, primary keys, foreign keys, indexes) across PostgreSQL, MySQL, and SQLite')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'schema', 'introspection', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalGetSchemaInputSchema)
  .example({
    description: 'Inspect all SQLite tables',
    input: {
      vendor: 'sqlite' as DatabaseVendor,
      connectionString: ':memory:',
    },
  })
  .example({
    description: 'Inspect selected PostgreSQL tables with cache control',
    input: {
      vendor: 'postgresql' as DatabaseVendor,
      connectionString: 'postgresql://localhost/app',
      tables: ['public.users', 'public.orders'],
      cacheTtlMs: 30000,
      refreshCache: true,
    },
  })
  .implement(async (input) => {
    const { connectionString, vendor, ...operation } = input;
    const manager = new ConnectionManager({
      vendor,
      connection: connectionString,
    });

    const cacheKey = buildSchemaCacheKey(
      vendor,
      connectionString,
      input.database,
    );

    try {
      await manager.connect();
      return await invokeRelationalGetSchema(
        { executor: manager, vendor, schemaCacheKey: cacheKey },
        operation,
      );
    } catch (error) {
      return toGetSchemaErrorResponse({ executor: manager, vendor }, operation, error);
    } finally {
      await manager.disconnect();
    }
  })
  .build();
