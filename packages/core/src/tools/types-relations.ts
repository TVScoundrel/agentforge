/**
 * Relationships between tools to guide ordering and compatibility.
 */
export interface ToolRelations {
  requires?: string[];
  suggests?: string[];
  conflicts?: string[];
  follows?: string[];
  precedes?: string[];
}
