/**
 * Relational INSERT Tool
 *
 * Type-safe INSERT operations using Drizzle ORM query builder.
 * Supports single-row and batch inserts with configurable return behavior.
 *
 * @module tools/relational-insert
 */

import { toolBuilder, ToolCategory } from '@agentforge/core';
import { INSERT_CONNECTION_FAILURE } from '../../connection-failure-messages.js';
import { relationalInsertSchema } from './schemas.js';
import { executeInsert } from './executor.js';
import type {
  InsertErrorResponse,
  InsertResponse,
  RelationalInsertInput,
  RelationalInsertOperationInput,
} from './types.js';
import { isSafeInsertError } from './error-utils.js';
import type { RelationalMutationExecution } from '../mutation-execution.js';
import {
  replaceMutationConnectionFailure,
  withEphemeralRelationalMutationToolSet,
} from '../legacy-mutation-adapter.js';

// Re-export types and schemas for external use
export * from './types.js';
export * from './schemas.js';

function toInsertErrorResponse(error: unknown): InsertErrorResponse {
  const errorMessage = isSafeInsertError(error)
    ? error.message
    : 'Failed to execute INSERT query. Please verify your input and database connection.';

  return {
    success: false,
    error: errorMessage,
    rowCount: 0,
    insertedIds: [],
    rows: [],
  };
}

/** Execute INSERT through a session owned by the caller. */
export async function invokeRelationalInsert(
  execution: RelationalMutationExecution,
  input: RelationalInsertOperationInput
): Promise<InsertResponse> {
  try {
    const result = await executeInsert(
      execution.executor,
      { ...input, vendor: execution.vendor },
      execution.transaction ? { transaction: execution.transaction } : undefined
    );

    return {
      success: true,
      rowCount: result.rowCount,
      insertedIds: result.insertedIds,
      rows: result.rows,
      executionTime: result.executionTime,
      batch: result.batch,
    };
  } catch (error) {
    return toInsertErrorResponse(error);
  }
}

/**
 * Relational INSERT Tool
 *
 * Execute type-safe INSERT queries using Drizzle ORM query builder.
 *
 * @deprecated Configure a session-owning Relational Tool Set with
 * `createRelationalToolSet(...)` and use its `insert` Tool instead.
 */
export const relationalInsert = toolBuilder()
  .name('relational-insert')
  .displayName('Relational INSERT')
  .description('Execute type-safe INSERT queries with single-row and batch insert support')
  .category(ToolCategory.DATABASE)
  .tags(['database', 'sql', 'insert', 'postgresql', 'mysql', 'sqlite'])
  .schema(relationalInsertSchema)
  .example({
    description: 'Insert a single row and return generated ID',
    input: {
      table: 'users',
      data: { name: 'Alice', email: 'alice@example.com' },
      returning: { mode: 'id', idColumn: 'id' },
      vendor: 'postgresql',
      connectionString: 'postgresql://localhost/mydb',
    },
  })
  .example({
    description: 'Batch insert rows',
    input: {
      table: 'users',
      data: [
        { name: 'Bob', email: 'bob@example.com' },
        { name: 'Carol', email: 'carol@example.com' },
      ],
      batch: {
        batchSize: 250,
        continueOnError: true,
        maxRetries: 1,
      },
      vendor: 'sqlite',
      connectionString: 'data.db',
    },
  })
  .implement(async (input: RelationalInsertInput): Promise<InsertResponse> => {
    const { connectionString, vendor, ...operation } = input;
    return withEphemeralRelationalMutationToolSet({ vendor, connectionString }, async (toolSet) => {
      try {
        return replaceMutationConnectionFailure(
          await toolSet.insert.invoke(operation),
          INSERT_CONNECTION_FAILURE,
          'Failed to execute INSERT query. Please verify your input and database connection.'
        );
      } catch (error) {
        return toInsertErrorResponse(error);
      }
    });
  })
  .build();
