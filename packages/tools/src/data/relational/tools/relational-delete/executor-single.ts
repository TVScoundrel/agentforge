import { buildDeleteQuery } from '../../query/query-builder.js';
import type { SqlExecutor } from '../../query/types.js';
import type { DeleteResult, RelationalDeleteExecutionInput } from './types.js';
import {
  normalizeAffectedRows,
  type DeleteExecutionContext,
  type SingleDeleteOperation,
} from './executor-shared.js';

export async function executeSingleDelete(
  executor: SqlExecutor,
  input: RelationalDeleteExecutionInput,
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

  const session = context?.transaction ?? executor;
  const rawResult = await session.execute(built.query);
  const rowCount = normalizeAffectedRows(rawResult);

  return {
    rowCount,
    executionTime: 0,
    softDeleted: built.usesSoftDelete,
  };
}
