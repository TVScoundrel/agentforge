/**
 * Shared public diff-report types for relational schema comparison.
 */

/** Describes a difference for a single column. */
export interface ColumnDiff {
  column: string;
  type: 'added' | 'removed' | 'changed';
  /** Present when type is `changed`. */
  changes?: Array<{
    property: string;
    before: unknown;
    after: unknown;
  }>;
}

/** Describes a difference for a single table. */
export interface TableDiff {
  table: string;
  type: 'added' | 'removed' | 'changed';
  /** Present when type is `changed` with per-column changes. */
  columns?: ColumnDiff[];
  /** Present when type is `changed` with primary-key changes. */
  primaryKeyChanged?: { before: string[]; after: string[] };
}

/** Full diff report between two schemas. */
export interface SchemaDiffResult {
  /** Whether the schemas are identical. */
  identical: boolean;
  /** Per-table differences. */
  tables: TableDiff[];
  /** Summary counts. */
  summary: {
    tablesAdded: number;
    tablesRemoved: number;
    tablesChanged: number;
    columnsAdded: number;
    columnsRemoved: number;
    columnsChanged: number;
  };
}
