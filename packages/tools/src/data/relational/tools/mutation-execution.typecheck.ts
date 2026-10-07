import type { RelationalMutationExecutionContext } from './mutation-execution.js';
import type { InsertExecutionContext } from './relational-insert/executor.js';
import type { InsertExecutionContext as SharedInsertContext } from './relational-insert/executor-shared.js';
import type { UpdateExecutionContext } from './relational-update/executor.js';
import type { UpdateExecutionContext as SharedUpdateContext } from './relational-update/executor-shared.js';
import type { DeleteExecutionContext } from './relational-delete/executor.js';
import type { DeleteExecutionContext as SharedDeleteContext } from './relational-delete/executor-shared.js';

type Assert<T extends true> = T;
type SameContext<T> = [T] extends [RelationalMutationExecutionContext]
  ? [RelationalMutationExecutionContext] extends [T]
    ? true
    : false
  : false;

// Both existing import paths must accept the common optional transaction context.
export type MutationContextCompatibility = [
  Assert<SameContext<InsertExecutionContext>>,
  Assert<SameContext<SharedInsertContext>>,
  Assert<SameContext<UpdateExecutionContext>>,
  Assert<SameContext<SharedUpdateContext>>,
  Assert<SameContext<DeleteExecutionContext>>,
  Assert<SameContext<SharedDeleteContext>>,
];
