/**
 * Schema diff and serialisation utilities.
 *
 * Compare two {@link DatabaseSchema} instances and produce a structured
 * diff report. Also provide JSON export / import for snapshot testing
 * and cross-environment schema comparison.
 *
 * @module schema/schema-diff
 */

export type { ColumnDiff, TableDiff, SchemaDiffResult } from './schema-diff-types.js';
export { diffSchemas } from './schema-diff-comparison.js';
export { exportSchemaToJson, importSchemaFromJson } from './schema-diff-json.js';
