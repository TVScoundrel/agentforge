/**
 * Query builder adapter for relational SELECT operations.
 * @module tools/relational-select/query-builder
 */

import {
  buildSelectQuery as buildSharedSelectQuery,
  type SelectQueryInput,
} from '../../query/query-builder.js';
import type { RelationalSelectInput } from './types.js';

/**
 * Build a complete SELECT query using shared query builder utilities.
 */
export function buildSelectQuery(input: RelationalSelectInput) {
  const queryInput: SelectQueryInput = {
    table: input.table,
    columns: input.columns,
    where: input.where,
    orderBy: input.orderBy,
    limit: input.limit,
    offset: input.offset,
    vendor: input.vendor,
  };

  return buildSharedSelectQuery(queryInput);
}
