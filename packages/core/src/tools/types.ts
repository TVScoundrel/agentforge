/**
 * Tool System Types
 * 
 * Core type definitions for the AgentForge tool system.
 * These types define the structure and metadata for tools.
 */

import { z } from 'zod';

/**
 * ToolCategory - Categories for organizing tools
 * 
 * Why use an enum?
 * - Type safety: Can't use invalid categories
 * - Autocomplete: IDE suggests valid options
 * - Consistency: Everyone uses the same category names
 * 
 * Example:
 * ```ts
 * const tool = { category: ToolCategory.FILE_SYSTEM };
 * ```
 */
export enum ToolCategory {
  /**
   * Tools for file system operations
   * Examples: read-file, write-file, list-directory
   */
  FILE_SYSTEM = 'file-system',

  /**
   * Tools for web/HTTP operations
   * Examples: http-request, web-scrape, download-file
   */
  WEB = 'web',

  /**
   * Tools for code operations
   * Examples: execute-code, analyze-syntax, format-code
   */
  CODE = 'code',

  /**
   * Tools for database operations
   * Examples: query-database, insert-record, update-record
   */
  DATABASE = 'database',

  /**
   * Tools for API integrations
   * Examples: github-api, slack-api, stripe-api
   */
  API = 'api',

  /**
   * General utility tools
   * Examples: calculate, format-date, generate-uuid
   */
  UTILITY = 'utility',

  /**
   * Custom/user-defined tools
   * Use this for tools that don't fit other categories
   */
  CUSTOM = 'custom',
}

/**
 * ToolExample - Example usage of a tool
 * 
 * Why examples?
 * - Help LLMs understand how to use the tool
 * - Provide documentation for developers
 * - Enable few-shot learning in prompts
 * 
 * Example:
 * ```ts
 * const example: ToolExample = {
 *   description: 'Read a text file',
 *   input: { path: './README.md' },
 *   output: '# My Project\n\nWelcome...',
 *   explanation: 'Reads the file and returns its contents as a string'
 * };
 * ```
 */
export interface ToolExample {
  /**
   * What this example demonstrates
   * Should be concise and clear
   */
  description: string;

  /**
   * Example input parameters
   * Must match the tool's schema
   */
  input: Record<string, unknown>;

  /**
   * Expected output (optional)
   * Helps users understand what to expect
   */
  output?: unknown;

  /**
   * Additional explanation (optional)
   * Why this example works, edge cases, etc.
   */
  explanation?: string;
}

/**
 * ToolMetadata - Rich metadata for a tool
 * 
 * Why so much metadata?
 * - Better LLM understanding: More context = better tool selection
 * - Better developer experience: Clear documentation
 * - Better discoverability: Search by tags, categories
 * - Better maintenance: Version tracking, deprecation warnings
 * 
 * Example:
 * ```ts
 * const metadata: ToolMetadata = {
 *   name: 'read-file',
 *   displayName: 'Read File',
 *   description: 'Read contents of a file from the file system',
 *   category: ToolCategory.FILE_SYSTEM,
 *   tags: ['file', 'read', 'io'],
 *   examples: [{ description: 'Read README', input: { path: './README.md' } }],
 *   usageNotes: 'Paths are relative to current working directory',
 *   limitations: ['Cannot read files larger than 10MB'],
 *   version: '1.0.0',
 *   author: 'AgentForge'
 * };
 * ```
 */
export interface ToolMetadata {
  // ===== REQUIRED FIELDS =====

  /**
   * Unique identifier for the tool
   * Must be kebab-case (lowercase with hyphens)
   * Examples: 'read-file', 'http-request', 'query-database'
   */
  name: string;

  /**
   * Clear description of what the tool does
   * Should be 1-2 sentences, written for LLMs to understand
   * Example: 'Read the contents of a file from the file system'
   */
  description: string;

  /**
   * Primary category for this tool
   * Used for grouping and filtering
   */
  category: ToolCategory;

  // ===== OPTIONAL FIELDS =====

  /**
   * Human-readable display name (optional)
   * Example: 'Read File' instead of 'read-file'
   */
  displayName?: string;

  /**
   * Tags for search and filtering (optional)
   * Example: ['file', 'read', 'io', 'filesystem']
   */
  tags?: string[];

  /**
   * Usage examples (optional but highly recommended)
   * Helps LLMs understand how to use the tool
   */
  examples?: ToolExample[];

  /**
   * Additional usage notes (optional)
   * Important details about how to use the tool
   * Example: 'Paths are relative to the current working directory'
   */
  usageNotes?: string;

  /**
   * Known limitations (optional)
   * What the tool cannot do
   * Example: ['Cannot read files larger than 10MB', 'Requires read permissions']
   */
  limitations?: string[];

  /**
   * Tool version (optional)
   * Semantic versioning recommended
   * Example: '1.0.0'
   */
  version?: string;

  /**
   * Tool author (optional)
   * Who created/maintains this tool
   * Example: 'AgentForge Team'
   */
  author?: string;

  /**
   * Deprecation flag (optional)
   * Set to true if this tool should no longer be used
   */
  deprecated?: boolean;

  /**
   * Replacement tool name (optional)
   * If deprecated, what tool should be used instead?
   * Example: 'read-file-v2'
   */
  replacedBy?: string;
}

/**
 * Tool - Complete tool definition
 * 
 * This is the main interface that combines:
 * - Metadata: What the tool is and how to use it
 * - Schema: What inputs it accepts (validated with Zod)
 * - Execute: The actual implementation
 * 
 * Why generic types?
 * - TInput: Type of the input parameters (inferred from schema)
 * - TOutput: Type of the return value
 * - This gives us full type safety!
 * 
 * Example:
 * ```ts
 * const readFileTool: Tool<{ path: string }, string> = {
 *   metadata: { name: 'read-file', ... },
 *   schema: z.object({ path: z.string() }),
 *   execute: async ({ path }) => {
 *     // Implementation here
 *     return fileContents;
 *   }
 * };
 * ```
 */
export interface Tool<TInput = unknown, TOutput = unknown> {
  /**
   * Rich metadata about the tool
   */
  metadata: ToolMetadata;

  /**
   * Zod schema for input validation
   * 
   * Why Zod?
   * - Runtime validation: Catch errors before execution
   * - Type inference: TypeScript types from schema
   * - Great error messages: Clear validation errors
   * - JSON Schema conversion: For LangChain integration
   */
  schema: z.ZodSchema<TInput>;

  /**
   * Tool implementation
   * 
   * Why async?
   * - Most tools do I/O (files, network, database)
   * - Async is more flexible (can handle both sync and async)
   * 
   * The input is automatically validated against the schema
   * before this function is called.
   */
  execute: (input: TInput) => Promise<TOutput>;
}

