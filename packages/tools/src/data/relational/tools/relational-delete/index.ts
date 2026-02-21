/**
 * Relational DELETE Tool
 *
 * Type-safe DELETE operations using Drizzle ORM query builder.
 * Supports WHERE conditions, full-table delete protection, and optional soft delete mode.
 *
 * @module tools/relational-delete
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { ConnectionManager } from '../../connection/connection-manager.js';
import { relationalDeleteSchema } from './schemas.js';
import { executeDelete } from './executor.js';
import type { RelationalDeleteInput, DeleteResponse } from './types.js';
import { isSafeDeleteError } from './error-utils.js';

export * from './types.js';
export * from './schemas.js';

/**
 * LangGraph tool for type-safe DELETE queries with single and batched operation support.
 *
 * Supports WHERE conditions, full-table-delete protection, soft-delete mode,
 * batch operations with retry logic, and optional cascade hints.
 */
export const relationalDelete = toolBuilder()
  .name('relational-delete')
  .displayName('Relational DELETE')
  .description('Execute type-safe DELETE queries with single and batched operation support')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'delete', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalDeleteSchema)
  .example({
    description: 'Delete one row by condition',
    input: {
      table: 'users',
      where: [{ column: 'id', operator: 'eq', value: 123 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb',
    },
  })
  .example({
    description: 'Soft delete rows',
    input: {
      table: 'users',
      where: [{ column: 'status', operator: 'eq', value: 'inactive' }],
      softDelete: { column: 'deleted_at' },
      vendor: 'sqlite',
      connectionString: 'data.db',
    },
  })
  .example({
    description: 'Batch delete operations',
    input: {
      table: 'users',
      operations: [
        {
          where: [{ column: 'status', operator: 'eq', value: 'inactive' }],
          softDelete: { column: 'deleted_at' },
        },
        {
          where: [{ column: 'status', operator: 'eq', value: 'pending_delete' }],
          softDelete: { column: 'deleted_at' },
        },
      ],
      batch: {
        batchSize: 100,
        continueOnError: true,
      },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb',
    },
  })
  .implement(async (input: RelationalDeleteInput): Promise<DeleteResponse> => {
    const manager = new ConnectionManager({
      vendor: input.vendor,
      connection: input.connectionString,
    });

    try {
      await manager.connect();

      const result = await executeDelete(manager, input);

      return {
        success: true,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        softDeleted: result.softDeleted,
        batch: result.batch,
      };
    } catch (error) {
      let errorMessage = 'Failed to execute DELETE query. Please verify your input and database connection.';

      if (isSafeDeleteError(error)) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        rowCount: 0,
        softDeleted: false,
      };
    } finally {
      await manager.disconnect();
    }
  })
  .build();
