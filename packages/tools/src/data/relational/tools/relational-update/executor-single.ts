import { buildUpdateQuery } from '../../query/query-builder.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { RelationalUpdateInput, UpdateResult } from './types.js';
import {
  normalizeAffectedRows,
  type SingleUpdateOperation,
  type UpdateExecutionContext,
} from './executor-shared.js';

export async function executeSingleUpdate(
  manager: ConnectionManager,
  input: RelationalUpdateInput,
  operation: SingleUpdateOperation,
  context?: UpdateExecutionContext
): Promise<UpdateResult> {
  const built = buildUpdateQuery({
    table: input.table,
    data: operation.data,
    where: operation.where,
    allowFullTableUpdate: operation.allowFullTableUpdate,
    optimisticLock: operation.optimisticLock,
    vendor: input.vendor,
  });

  const executor = context?.transaction ?? manager;
  const rawResult = await executor.execute(built.query);
  const rowCount = normalizeAffectedRows(rawResult);

  if (built.usesOptimisticLock && rowCount === 0) {
    throw new Error('Update failed: optimistic lock check failed.');
  }

  return {
    rowCount,
    executionTime: 0,
  };
}
