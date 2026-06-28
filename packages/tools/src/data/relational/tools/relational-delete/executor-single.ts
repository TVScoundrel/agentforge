import { buildDeleteQuery } from '../../query/query-builder.js';
import type { ConnectionManager } from '../../connection/connection-manager.js';
import type { DeleteResult, RelationalDeleteInput } from './types.js';
import {
  normalizeAffectedRows,
  type DeleteExecutionContext,
  type SingleDeleteOperation,
} from './executor-shared.js';

export async function executeSingleDelete(
  manager: ConnectionManager,
  input: RelationalDeleteInput,
  operation: SingleDeleteOperation,
  context?: DeleteExecutionContext
): Promise<DeleteResult> {
  const built = buildDeleteQuery({
    table: input.table,
    where: operation.where,
    allowFullTableDelete: operation.allowFullTableDelete,
    softDelete: operation.softDelete,
    vendor: input.vendor,
  });

  const executor = context?.transaction ?? manager;
  const rawResult = await executor.execute(built.query);
  const rowCount = normalizeAffectedRows(rawResult);

  return {
    rowCount,
    executionTime: 0,
    softDeleted: built.usesSoftDelete,
  };
}
