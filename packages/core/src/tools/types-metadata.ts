import { ToolCategory } from './types-category.js';
import type { ToolExample } from './types-example.js';
import type { ToolRelations } from './types-relations.js';

/**
 * Rich metadata describing a tool, its examples, and its lifecycle state.
 */
export interface ToolMetadata {
  name: string;
  description: string;
  category: ToolCategory;
  displayName?: string;
  tags?: string[];
  examples?: ToolExample[];
  usageNotes?: string;
  limitations?: string[];
  version?: string;
  author?: string;
  deprecated?: boolean;
  replacedBy?: string;
  relations?: ToolRelations;
}
