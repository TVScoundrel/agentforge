/**
 * Example usage of a tool to aid documentation and prompt construction.
 */
export interface ToolExample {
  description: string;
  input: Record<string, unknown>;
  output?: unknown;
  explanation?: string;
}
