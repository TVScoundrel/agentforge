/**
 * Schema introspection, validation, and metadata utilities
 * @module schema
 */

export type {
  ForeignKeySchema,
  IndexSchema,
  ColumnSchema,
  TableSchema,
  DatabaseSchema,
  SchemaInspectOptions,
  SchemaInspectorConfig,
} from './types.js';

export { SchemaInspector } from './schema-inspector.js';

// Schema validation (ST-03002)
export type { ValidationResult } from './schema-validator.js';
export {
  validateTableExists,
  validateColumnsExist,
  validateColumnTypes,
} from './schema-validator.js';

// Type mapper (ST-03002)
export type { MappedType } from './type-mapper.js';
export { mapColumnType, mapSchemaTypes, getVendorTypeMap } from './type-mapper.js';

// Schema diff and serialisation (ST-03002)
export type {
  ColumnDiff,
  TableDiff,
  SchemaDiffResult,
} from './schema-diff.js';
export {
  diffSchemas,
  exportSchemaToJson,
  importSchemaFromJson,
} from './schema-diff.js';
