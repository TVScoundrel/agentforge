/**
 * Relational UPDATE Tool
 *
 * Type-safe UPDATE operations using Drizzle ORM query builder.
 * Supports WHERE conditions, full-table update protection, and optimistic locking.
 *
 * @module tools/relational-update
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { UPDATE_CONNECTION_FAILURE } from '../../connection-failure-messages.js';
import { relationalUpdateSchema } from './schemas.js';
import { executeUpdate } from './executor.js';
import type {
  RelationalUpdateInput,
  RelationalUpdateOperationInput,
  UpdateErrorResponse,
  UpdateResponse,
} from './types.js';
import { isSafeUpdateError } from './error-utils.js';
import type { RelationalMutationExecution } from '../mutation-execution.js';
import {
  replaceMutationConnectionFailure,
  withEphemeralRelationalMutationToolSet,
} from '../legacy-mutation-adapter.js';

// Re-export types and schemas for external use
export * from './types.js';
export * from './schemas.js';

function toUpdateErrorResponse(error: unknown): UpdateErrorResponse {
  const errorMessage = isSafeUpdateError(error)
    ? error.message
    : 'Failed to execute UPDATE query. Please verify your input and database connection.';

  return {
    success: false,
    error: errorMessage,
    rowCount: 0,
  };
}

/** Execute UPDATE through a session owned by the caller. */
export async function invokeRelationalUpdate(
  execution: RelationalMutationExecution,
  input: RelationalUpdateOperationInput
): Promise<UpdateResponse> {
  try {
    const result = await executeUpdate(
      execution.executor,
      { ...input, vendor: execution.vendor },
      execution.transaction ? { transaction: execution.transaction } : undefined
    );

    return {
      success: true,
      rowCount: result.rowCount,
      executionTime: result.executionTime,
      batch: result.batch,
    };
  } catch (error) {
    return toUpdateErrorResponse(error);
  }
}

/**
 * Relational UPDATE Tool
 *
 * Execute type-safe UPDATE queries using Drizzle ORM query builder.
 *
 * @deprecated Configure a session-owning Relational Tool Set with
 * `createRelationalToolSet(...)` and use its `update` Tool instead.
 */
export const relationalUpdate = toolBuilder()
  .name('relational-update')
  .displayName('Relational UPDATE')
  .description('Execute type-safe UPDATE queries with single and batched operation support')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'update', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalUpdateSchema)
  .example({
    description: 'Update one row by condition',
    input: {
      table: 'users',
      data: { status: 'inactive' },
      where: [{ column: 'id', operator: 'eq', value: 123 }],
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb',
    },
  })
  .example({
    description: 'Optimistic lock update',
    input: {
      table: 'users',
      data: { status: 'active' },
      where: [{ column: 'id', operator: 'eq', value: 123 }],
      optimisticLock: { column: 'version', expectedValue: 5 },
      vendor: 'sqlite',
      connectionString: 'data.db',
    },
  })
  .example({
    description: 'Batch update operations',
    input: {
      table: 'users',
      operations: [
        {
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq', value: 1 }],
        },
        {
          data: { status: 'inactive' },
          where: [{ column: 'id', operator: 'eq', value: 2 }],
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
  .implement(async (input: RelationalUpdateInput): Promise<UpdateResponse> => {
    const { connectionString, vendor, ...operation } = input;
    return withEphemeralRelationalMutationToolSet(
      { vendor, connectionString },
      async (toolSet) =>
        replaceMutationConnectionFailure(
          await toolSet.update.invoke(operation),
          UPDATE_CONNECTION_FAILURE,
          'Failed to execute UPDATE query. Please verify your input and database connection.'
        ),
      toUpdateErrorResponse
    );
  })
  .build();
