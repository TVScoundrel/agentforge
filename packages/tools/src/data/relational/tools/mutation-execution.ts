import type { TransactionContext } from '../query/transaction.js';
import type { SqlExecutor } from '../query/types.js';
import type { DatabaseVendor } from '../types.js';

/** Runtime dependencies supplied by a session-owning Relational Tool Set. */
export interface RelationalMutationExecution {
  executor: SqlExecutor;
  vendor: DatabaseVendor;
  transaction?: TransactionContext;
}
