/**
 * Tool Builder API
 * 
 * Fluent interface for creating tools with automatic validation.
 * 
 * @example
 * ```ts
 * const tool = createToolBuilder()
 *   .name('read-file')
 *   .description('Read a file from the file system')
 *   .category(ToolCategory.FILE_SYSTEM)
 *   .tags(['file', 'read', 'io'])
 *   .schema(z.object({
 *     path: z.string().describe('Path to the file')
 *   }))
 *   .implement(async ({ path }) => {
 *     // Implementation
 *   })
 *   .build();
 * ```
 */

import { z } from 'zod';
import { Tool, ToolCategory, ToolExample, ToolMetadata, ToolRelations } from './types.js';
import { createTool } from './helpers.js';

/**
 * Builder for creating tools with a fluent API
 *
 * This provides a more ergonomic way to create tools compared to
 * manually constructing the metadata object.
 */
export class ToolBuilder<TInput = unknown, TOutput = unknown> {
  private metadata: Partial<ToolMetadata> = {};
  private _schema?: z.ZodSchema<TInput>;
  private _invoke?: (input: TInput) => Promise<TOutput>;

  /**
   * Set the tool name (required)
   * 
   * @param name - Tool name in kebab-case (e.g., 'read-file')
   */
  name(name: string): this {
    this.metadata.name = name;
    return this;
  }

  /**
   * Set the tool description (required)
   * 
   * @param description - Clear description of what the tool does
   */
  description(description: string): this {
    this.metadata.description = description;
    return this;
  }

  /**
   * Set the tool category (required)
   * 
   * @param category - Tool category for organization
   */
  category(category: ToolCategory): this {
    this.metadata.category = category;
    return this;
  }

  /**
   * Set the display name (optional)
   * 
   * @param displayName - Human-friendly name for UI display
   */
  displayName(displayName: string): this {
    this.metadata.displayName = displayName;
    return this;
  }

  /**
   * Set tags for searchability (optional)
   * 
   * @param tags - Array of tags for categorization and search
   */
  tags(tags: string[]): this {
    this.metadata.tags = tags;
    return this;
  }

  /**
   * Add a single tag (optional)
   * 
   * @param tag - Tag to add
   */
  tag(tag: string): this {
    if (!this.metadata.tags) {
      this.metadata.tags = [];
    }
    this.metadata.tags.push(tag);
    return this;
  }

  /**
   * Add an example (optional)
   * 
   * @param example - Usage example for the tool
   */
  example(example: ToolExample): this {
    if (!this.metadata.examples) {
      this.metadata.examples = [];
    }
    this.metadata.examples.push(example);
    return this;
  }

  /**
   * Set usage notes (optional)
   * 
   * @param notes - Important usage information
   */
  usageNotes(notes: string): this {
    this.metadata.usageNotes = notes;
    return this;
  }

  /**
   * Set limitations (optional)
   * 
   * @param limitations - Array of known limitations
   */
  limitations(limitations: string[]): this {
    this.metadata.limitations = limitations;
    return this;
  }

  /**
   * Add a single limitation (optional)
   * 
   * @param limitation - Limitation to add
   */
  limitation(limitation: string): this {
    if (!this.metadata.limitations) {
      this.metadata.limitations = [];
    }
    this.metadata.limitations.push(limitation);
    return this;
  }

  /**
   * Set version (optional)
   * 
   * @param version - Semantic version string
   */
  version(version: string): this {
    this.metadata.version = version;
    return this;
  }

  /**
   * Set author (optional)
   *
   * @param author - Tool author name
   */
  author(author: string): this {
    this.metadata.author = author;
    return this;
  }

  /**
   * Set tools that must be called before this tool (optional)
   *
   * @param tools - Array of tool names that are required
   * @example
   * ```ts
   * .requires(['view-file', 'search-codebase'])
   * ```
   */
  requires(tools: string[]): this {
    if (!this.metadata.relations) {
      this.metadata.relations = {};
    }
    this.metadata.relations.requires = tools;
    return this;
  }

  /**
   * Set tools that work well with this tool (optional)
   *
   * @param tools - Array of tool names that are suggested
   * @example
   * ```ts
   * .suggests(['run-tests', 'format-code'])
   * ```
   */
  suggests(tools: string[]): this {
    if (!this.metadata.relations) {
      this.metadata.relations = {};
    }
    this.metadata.relations.suggests = tools;
    return this;
  }

  /**
   * Set tools that conflict with this tool (optional)
   *
   * @param tools - Array of tool names that conflict
   * @example
   * ```ts
   * .conflicts(['delete-file'])
   * ```
   */
  conflicts(tools: string[]): this {
    if (!this.metadata.relations) {
      this.metadata.relations = {};
    }
    this.metadata.relations.conflicts = tools;
    return this;
  }

  /**
   * Set tools this typically follows in a workflow (optional)
   *
   * @param tools - Array of tool names this follows
   * @example
   * ```ts
   * .follows(['search-codebase', 'view-file'])
   * ```
   */
  follows(tools: string[]): this {
    if (!this.metadata.relations) {
      this.metadata.relations = {};
    }
    this.metadata.relations.follows = tools;
    return this;
  }

  /**
   * Set tools this typically precedes in a workflow (optional)
   *
   * @param tools - Array of tool names this precedes
   * @example
   * ```ts
   * .precedes(['run-tests'])
   * ```
   */
  precedes(tools: string[]): this {
    if (!this.metadata.relations) {
      this.metadata.relations = {};
    }
    this.metadata.relations.precedes = tools;
    return this;
  }

  /**
   * Set the input schema (required)
   * 
   * All fields MUST have .describe() for LLM understanding!
   * 
   * @param schema - Zod schema for input validation
   */
  schema<T>(schema: z.ZodSchema<T>): ToolBuilder<T, TOutput> {
    (this as any)._schema = schema;
    return this as any;
  }

  /**
   * Set the implementation function (required)
   *
   * @param invoke - Async function that implements the tool
   */
  implement<T>(invoke: (input: TInput) => Promise<T>): ToolBuilder<TInput, T> {
    (this as any)._invoke = invoke;
    return this as any;
  }

  /**
   * Set the implementation function with automatic error handling
   *
   * Wraps the implementation in a try-catch block and returns a standardized
   * result object with success/error information.
   *
   * @param invoke - Async function that implements the tool
   * @returns ToolBuilder with safe result type { success: boolean; data?: T; error?: string }
   *
   * @example
   * ```ts
   * const tool = toolBuilder()
   *   .name('read-file')
   *   .schema(z.object({ path: z.string() }))
   *   .implementSafe(async ({ path }) => {
   *     return await fs.readFile(path, 'utf-8');
   *   })
   *   .build();
   *
   * // Result will be: { success: true, data: "file content" }
   * // Or on error: { success: false, error: "ENOENT: no such file..." }
   * ```
   */
  implementSafe<T>(
    invoke: (input: TInput) => Promise<T>
  ): ToolBuilder<TInput, { success: boolean; data?: T; error?: string }> {
    const safeInvoke = async (input: TInput) => {
      try {
        const data = await invoke(input);
        return { success: true, data };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    };

    (this as any)._invoke = safeInvoke;
    return this as any;
  }

  /**
   * Build the tool with validation
   *
   * Validates:
   * - All required fields are present
   * - Metadata is valid
   * - Schema has descriptions on all fields
   *
   * @returns The validated tool
   * @throws {Error} If validation fails
   */
  build(): Tool<TInput, TOutput> {
    // Check required fields
    if (!this.metadata.name) {
      throw new Error('Tool name is required. Use .name() to set it.');
    }
    if (!this.metadata.description) {
      throw new Error('Tool description is required. Use .description() to set it.');
    }
    if (!this.metadata.category) {
      throw new Error('Tool category is required. Use .category() to set it.');
    }
    if (!this._schema) {
      throw new Error('Tool schema is required. Use .schema() to set it.');
    }
    if (!this._invoke) {
      throw new Error('Tool implementation is required. Use .implement() to set it.');
    }

    // Use createTool for validation
    return createTool(
      this.metadata as ToolMetadata,
      this._schema,
      this._invoke
    );
  }
}

/**
 * Create a new tool builder
 * 
 * @example
 * ```ts
 * const tool = toolBuilder()
 *   .name('my-tool')
 *   .description('Does something useful')
 *   .category(ToolCategory.UTILITY)
 *   .schema(z.object({ input: z.string().describe('Input') }))
 *   .implement(async ({ input }) => input)
 *   .build();
 * ```
 */
export function toolBuilder(): ToolBuilder {
  return new ToolBuilder();
}

