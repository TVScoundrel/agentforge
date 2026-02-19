/**
 * Schema introspection and metadata
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
