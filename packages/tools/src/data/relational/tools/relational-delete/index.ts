/**
 * Relational DELETE Tool
 *
 * Type-safe DELETE operations using Drizzle ORM query builder.
 * Supports WHERE conditions, full-table delete protection, and optional soft delete mode.
 *
 * @module tools/relational-delete
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { DELETE_CONNECTION_FAILURE } from '../../connection-failure-messages.js';
import { relationalDeleteSchema } from './schemas.js';
import { executeDelete } from './executor.js';
import type {
  DeleteErrorResponse,
  DeleteResponse,
  RelationalDeleteInput,
  RelationalDeleteOperationInput,
} from './types.js';
import { isSafeDeleteError } from './error-utils.js';
import type { RelationalMutationExecution } from '../mutation-execution.js';
import {
  replaceMutationConnectionFailure,
  withEphemeralRelationalMutationToolSet,
} from '../legacy-mutation-adapter.js';

export * from './types.js';
export * from './schemas.js';

function toDeleteErrorResponse(error: unknown): DeleteErrorResponse {
  const errorMessage = isSafeDeleteError(error)
    ? error.message
    : 'Failed to execute DELETE query. Please verify your input and database connection.';

  return {
    success: false,
    error: errorMessage,
    rowCount: 0,
    softDeleted: false,
  };
}

/** Execute DELETE through a session owned by the caller. */
export async function invokeRelationalDelete(
  execution: RelationalMutationExecution,
  input: RelationalDeleteOperationInput
): Promise<DeleteResponse> {
  try {
    const result = await executeDelete(
      execution.executor,
      { ...input, vendor: execution.vendor },
      execution.transaction ? { transaction: execution.transaction } : undefined
    );

    return {
      success: true,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      softDeleted: result.softDeleted,
      batch: result.batch,
    };
  } catch (error) {
    return toDeleteErrorResponse(error);
  }
}

/**
 * LangGraph tool for type-safe DELETE queries with single and batched operation support.
 *
 * Supports WHERE conditions, full-table-delete protection, soft-delete mode,
 * batch operations with retry logic, and optional cascade hints.
 *
 * @deprecated Configure a session-owning Relational Tool Set with
 * `createRelationalToolSet(...)` and use its `delete` Tool instead.
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
    const { connectionString, vendor, ...operation } = input;
    return withEphemeralRelationalMutationToolSet({ vendor, connectionString }, async (toolSet) => {
      try {
        return replaceMutationConnectionFailure(
          await toolSet.delete.invoke(operation),
          DELETE_CONNECTION_FAILURE,
          'Failed to execute DELETE query. Please verify your input and database connection.'
        );
      } catch (error) {
        return toDeleteErrorResponse(error);
      }
    });
  })
  .build();
