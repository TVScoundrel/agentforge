/**
 * Tool Registry
 * 
 * Central registry for managing and querying tools.
 * Provides CRUD operations, querying, and event notifications.
 * 
 * @example
 * ```ts
 * const registry = new ToolRegistry();
 * 
 * registry.register(readFileTool);
 * registry.register(writeFileTool);
 * 
 * const fileTool = registry.get('read-file');
 * const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
 * ```
 */

import { Tool, ToolCategory, ToolRelations } from './types.js';
import { toLangChainTools as convertToLangChainTools } from '../langchain/converter.js';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import { createLogger, LogLevel } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:core:tools:registry', { level: LogLevel.INFO });

/**
 * Registry events
 */
export enum RegistryEvent {
  TOOL_REGISTERED = 'tool:registered',
  TOOL_REMOVED = 'tool:removed',
  TOOL_UPDATED = 'tool:updated',
  REGISTRY_CLEARED = 'registry:cleared',
}

/**
 * Event handler type
 */
export type EventHandler = (data: any) => void;

/**
 * Options for generating tool prompts
 */
export interface PromptOptions {
  /** Include usage examples in the prompt */
  includeExamples?: boolean;
  /** Include usage notes in the prompt */
  includeNotes?: boolean;
  /** Include limitations in the prompt */
  includeLimitations?: boolean;
  /** Include tool relations in the prompt */
  includeRelations?: boolean;
  /** Group tools by category */
  groupByCategory?: boolean;
  /** Filter by specific categories */
  categories?: ToolCategory[];
  /** Maximum number of examples to include per tool */
  maxExamplesPerTool?: number;
  /**
   * Minimal mode - only supplementary context, not full definitions
   *
   * Use this when tool definitions are sent via API (OpenAI, Anthropic, etc.)
   *
   * When true:
   * - Excludes basic tool name/description/parameters
   * - Includes only relations, examples, notes, limitations
   * - Tool names are used as headers for matching
   *
   * When false (default):
   * - Includes full tool definitions (current behavior)
   * - Backward compatible
   */
  minimal?: boolean;
}

/**
 * Tool Registry - Central registry for managing tools
 * 
 * Features:
 * - CRUD operations (register, get, remove, update)
 * - Query operations (by category, tag, search)
 * - Bulk operations (registerMany, clear)
 * - Event system for observability
 * 
 * @example
 * ```ts
 * const registry = new ToolRegistry();
 * 
 * // Register tools
 * registry.register(myTool);
 * registry.registerMany([tool1, tool2, tool3]);
 * 
 * // Query tools
 * const tool = registry.get('my-tool');
 * const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
 * const searchResults = registry.search('file');
 * 
 * // Listen to events
 * registry.on(RegistryEvent.TOOL_REGISTERED, (tool) => {
 *   console.log('Tool registered:', tool.metadata.name);
 * });
 * ```
 */
export class ToolRegistry {
  private tools: Map<string, Tool<any, any>> = new Map();
  private eventHandlers: Map<RegistryEvent, Set<EventHandler>> = new Map();

  /**
   * Register a tool in the registry
   * 
   * @param tool - The tool to register
   * @throws Error if a tool with the same name already exists
   * 
   * @example
   * ```ts
   * registry.register(readFileTool);
   * ```
   */
  register(tool: Tool<any, any>): void {
    const name = tool.metadata.name;
    
    if (this.tools.has(name)) {
      throw new Error(
        `Tool with name "${name}" is already registered. Use update() to modify it.`
      );
    }

    this.tools.set(name, tool);
    this.emit(RegistryEvent.TOOL_REGISTERED, tool);
  }

  /**
   * Get a tool by name
   * 
   * @param name - The tool name
   * @returns The tool, or undefined if not found
   * 
   * @example
   * ```ts
   * const tool = registry.get('read-file');
   * if (tool) {
   *   const result = await tool.execute({ path: './file.txt' });
   * }
   * ```
   */
  get(name: string): Tool<any, any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists in the registry
   * 
   * @param name - The tool name
   * @returns True if the tool exists
   * 
   * @example
   * ```ts
   * if (registry.has('read-file')) {
   *   console.log('Tool exists!');
   * }
   * ```
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Remove a tool from the registry
   * 
   * @param name - The tool name
   * @returns True if the tool was removed, false if it didn't exist
   * 
   * @example
   * ```ts
   * const removed = registry.remove('read-file');
   * console.log(removed ? 'Removed' : 'Not found');
   * ```
   */
  remove(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) {
      return false;
    }

    this.tools.delete(name);
    this.emit(RegistryEvent.TOOL_REMOVED, tool);
    return true;
  }

  /**
   * Update an existing tool
   *
   * @param name - The tool name
   * @param tool - The new tool definition
   * @returns True if updated, false if the tool didn't exist
   *
   * @example
   * ```ts
   * const updated = registry.update('read-file', newReadFileTool);
   * ```
   */
  update(name: string, tool: Tool<any, any>): boolean {
    if (!this.tools.has(name)) {
      return false;
    }

    this.tools.set(name, tool);
    this.emit(RegistryEvent.TOOL_UPDATED, { name, tool });
    return true;
  }

  /**
   * Get all registered tools
   *
   * @returns Array of all tools
   *
   * @example
   * ```ts
   * const allTools = registry.getAll();
   * console.log(`Total tools: ${allTools.length}`);
   * ```
   */
  getAll(): Tool<any, any>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   *
   * @param category - The tool category
   * @returns Array of tools in the category
   *
   * @example
   * ```ts
   * const fileTools = registry.getByCategory(ToolCategory.FILE_SYSTEM);
   * ```
   */
  getByCategory(category: ToolCategory): Tool<any, any>[] {
    return this.getAll().filter((tool) => tool.metadata.category === category);
  }

  /**
   * Get tools by tag
   *
   * @param tag - The tag to search for
   * @returns Array of tools with the tag
   *
   * @example
   * ```ts
   * const fileTools = registry.getByTag('file');
   * ```
   */
  getByTag(tag: string): Tool<any, any>[] {
    return this.getAll().filter((tool) =>
      tool.metadata.tags?.includes(tag)
    );
  }

  /**
   * Search tools by name or description
   *
   * Case-insensitive search across tool names, display names, and descriptions.
   *
   * @param query - The search query
   * @returns Array of matching tools
   *
   * @example
   * ```ts
   * const results = registry.search('file');
   * // Returns tools with 'file' in name or description
   * ```
   */
  search(query: string): Tool<any, any>[] {
    const lowerQuery = query.toLowerCase();

    return this.getAll().filter((tool) => {
      const name = tool.metadata.name.toLowerCase();
      const displayName = tool.metadata.displayName?.toLowerCase() || '';
      const description = tool.metadata.description.toLowerCase();

      return (
        name.includes(lowerQuery) ||
        displayName.includes(lowerQuery) ||
        description.includes(lowerQuery)
      );
    });
  }

  /**
   * Register multiple tools at once
   *
   * @param tools - Array of tools to register
   * @throws Error if any tool name conflicts with existing tools
   *
   * @example
   * ```ts
   * registry.registerMany([tool1, tool2, tool3]);
   * ```
   */
  registerMany(tools: Tool<any, any>[]): void {
    // Check for duplicates within the input list first
    const inputNames = new Set<string>();
    const duplicatesInInput: string[] = [];

    for (const tool of tools) {
      const name = tool.metadata.name;
      if (inputNames.has(name)) {
        duplicatesInInput.push(name);
      } else {
        inputNames.add(name);
      }
    }

    if (duplicatesInInput.length > 0) {
      throw new Error(
        `Cannot register tools: duplicate names in input list: ${duplicatesInInput.join(', ')}`
      );
    }

    // Check for conflicts with existing tools
    const conflicts: string[] = [];
    for (const tool of tools) {
      if (this.tools.has(tool.metadata.name)) {
        conflicts.push(tool.metadata.name);
      }
    }

    if (conflicts.length > 0) {
      throw new Error(
        `Cannot register tools: the following names already exist: ${conflicts.join(', ')}`
      );
    }

    // Register all tools
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /**
   * Clear all tools from the registry
   *
   * @example
   * ```ts
   * registry.clear();
   * console.log(registry.size()); // 0
   * ```
   */
  clear(): void {
    this.tools.clear();
    this.emit(RegistryEvent.REGISTRY_CLEARED, null);
  }

  /**
   * Get the number of registered tools
   *
   * @returns Number of tools in the registry
   *
   * @example
   * ```ts
   * console.log(`Registry has ${registry.size()} tools`);
   * ```
   */
  size(): number {
    return this.tools.size;
  }

  /**
   * Get all tool names
   *
   * @returns Array of tool names
   *
   * @example
   * ```ts
   * const names = registry.getNames();
   * console.log('Available tools:', names.join(', '));
   * ```
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Register an event handler
   *
   * @param event - The event to listen for
   * @param handler - The handler function
   *
   * @example
   * ```ts
   * registry.on(RegistryEvent.TOOL_REGISTERED, (tool) => {
   *   console.log('New tool:', tool.metadata.name);
   * });
   * ```
   */
  on(event: RegistryEvent, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister an event handler
   *
   * @param event - The event to stop listening for
   * @param handler - The handler function to remove
   *
   * @example
   * ```ts
   * const handler = (tool) => console.log(tool);
   * registry.on(RegistryEvent.TOOL_REGISTERED, handler);
   * registry.off(RegistryEvent.TOOL_REGISTERED, handler);
   * ```
   */
  off(event: RegistryEvent, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered handlers
   *
   * @param event - The event to emit
   * @param data - The event data
   * @private
   */
  private emit(event: RegistryEvent, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          // Log error but don't throw to prevent one handler from breaking others
          logger.error('Event handler error', {
            event,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      });
    }
  }

  /**
   * Convert all registered tools to LangChain format
   *
   * This allows the entire registry to be used with LangChain agents.
   *
   * @returns Array of LangChain DynamicStructuredTools
   *
   * @example
   * ```ts
   * const registry = new ToolRegistry();
   * registry.registerMany([tool1, tool2, tool3]);
   *
   * const langchainTools = registry.toLangChainTools();
   *
   * const agent = createAgent({
   *   model: new ChatOpenAI(),
   *   tools: langchainTools,
   * });
   * ```
   */
  toLangChainTools(): DynamicStructuredTool[] {
    return convertToLangChainTools(this.getAll());
  }

  /**
   * Generate a formatted prompt describing all tools
   *
   * Creates a human-readable description of all tools in the registry,
   * suitable for inclusion in LLM prompts.
   *
   * @param options - Options for customizing the prompt
   * @returns Formatted prompt string
   *
   * @example
   * ```ts
   * const prompt = registry.generatePrompt({
   *   includeExamples: true,
   *   groupByCategory: true,
   *   maxExamplesPerTool: 2,
   * });
   *
   * console.log(prompt);
   * // Available Tools:
   * //
   * // FILE SYSTEM TOOLS:
   * // - read-file: Read a file from the file system
   * //   Parameters: path (string)
   * //   Example: Read a text file
   * //     Input: { "path": "./README.md" }
   * // ...
   * ```
   */
  generatePrompt(options: PromptOptions = {}): string {
    const {
      includeExamples = false,
      includeNotes = false,
      includeLimitations = false,
      includeRelations = false,
      groupByCategory = false,
      categories,
      maxExamplesPerTool,
      minimal = false,
    } = options;

    // Get tools to include
    let tools = this.getAll();

    // Filter by categories if specified
    if (categories && categories.length > 0) {
      tools = tools.filter((tool) => categories.includes(tool.metadata.category));
    }

    if (tools.length === 0) {
      return 'No tools available.';
    }

    const lines: string[] = ['Available Tools:', ''];

    if (groupByCategory) {
      // Group tools by category
      const toolsByCategory = new Map<ToolCategory, Tool<any, any>[]>();

      for (const tool of tools) {
        const category = tool.metadata.category;
        if (!toolsByCategory.has(category)) {
          toolsByCategory.set(category, []);
        }
        toolsByCategory.get(category)!.push(tool);
      }

      // Generate prompt for each category
      for (const [category, categoryTools] of toolsByCategory) {
        lines.push(`${category.toUpperCase().replace(/-/g, ' ')} TOOLS:`);

        for (const tool of categoryTools) {
          lines.push(...this.formatToolForPrompt(tool, {
            includeExamples,
            includeNotes,
            includeLimitations,
            includeRelations,
            maxExamplesPerTool,
            minimal,
          }));
        }

        lines.push('');
      }
    } else {
      // List all tools without grouping
      for (const tool of tools) {
        lines.push(...this.formatToolForPrompt(tool, {
          includeExamples,
          includeNotes,
          includeLimitations,
          includeRelations,
          maxExamplesPerTool,
          minimal,
        }));
        lines.push('');
      }
    }

    return lines.join('\n').trim();
  }

  /**
   * Format a single tool for inclusion in a prompt
   *
   * @param tool - The tool to format
   * @param options - Formatting options
   * @returns Array of formatted lines
   * @private
   */
  private formatToolForPrompt(
    tool: Tool<any, any>,
    options: {
      includeExamples?: boolean;
      includeNotes?: boolean;
      includeLimitations?: boolean;
      includeRelations?: boolean;
      maxExamplesPerTool?: number;
      minimal?: boolean;
    }
  ): string[] {
    const { metadata } = tool;
    const lines: string[] = [];

    // In minimal mode, only include supplementary context
    if (options.minimal) {
      // Tool name as header for matching with API-provided definitions
      lines.push(`## ${metadata.name}`);

      // Only include supplementary information not in the API definition
      let hasContent = false;

      // Relations
      if (options.includeRelations && metadata.relations) {
        const relationLines = this.formatRelations(metadata.relations);
        if (relationLines.length > 0) {
          lines.push(...relationLines);
          hasContent = true;
        }
      }

      // Examples
      if (options.includeExamples && metadata.examples && metadata.examples.length > 0) {
        const maxExamples = options.maxExamplesPerTool || metadata.examples.length;
        const examples = metadata.examples.slice(0, maxExamples);

        for (const example of examples) {
          lines.push(`  Example: ${example.description}`);
          lines.push(`    Input: ${JSON.stringify(example.input)}`);
          if (example.explanation) {
            lines.push(`    ${example.explanation}`);
          }
          hasContent = true;
        }
      }

      // Usage notes
      if (options.includeNotes && metadata.usageNotes) {
        lines.push(`  Notes: ${metadata.usageNotes}`);
        hasContent = true;
      }

      // Limitations
      if (options.includeLimitations && metadata.limitations && metadata.limitations.length > 0) {
        lines.push(`  Limitations:`);
        for (const limitation of metadata.limitations) {
          lines.push(`    - ${limitation}`);
        }
        hasContent = true;
      }

      // If no supplementary content, don't include this tool
      if (!hasContent) {
        return [];
      }

      return lines;
    }

    // Full mode: include complete tool definition
    // Tool name and description
    lines.push(`- ${metadata.name}: ${metadata.description}`);

    // Get schema properties
    const schemaShape = (tool.schema as any)._def?.shape?.();
    if (schemaShape) {
      const params = Object.keys(schemaShape);
      if (params.length > 0) {
        const paramDescriptions = params.map((param) => {
          const field = schemaShape[param];
          const type = field._def?.typeName?.replace('Zod', '').toLowerCase() || 'any';
          return `${param} (${type})`;
        });
        lines.push(`  Parameters: ${paramDescriptions.join(', ')}`);
      }
    }

    // Relations
    if (options.includeRelations && metadata.relations) {
      const relationLines = this.formatRelations(metadata.relations);
      if (relationLines.length > 0) {
        lines.push(...relationLines);
      }
    }

    // Usage notes
    if (options.includeNotes && metadata.usageNotes) {
      lines.push(`  Notes: ${metadata.usageNotes}`);
    }

    // Examples
    if (options.includeExamples && metadata.examples && metadata.examples.length > 0) {
      const maxExamples = options.maxExamplesPerTool || metadata.examples.length;
      const examples = metadata.examples.slice(0, maxExamples);

      for (const example of examples) {
        lines.push(`  Example: ${example.description}`);
        lines.push(`    Input: ${JSON.stringify(example.input)}`);
        if (example.explanation) {
          lines.push(`    ${example.explanation}`);
        }
      }
    }

    // Limitations
    if (options.includeLimitations && metadata.limitations && metadata.limitations.length > 0) {
      lines.push(`  Limitations:`);
      for (const limitation of metadata.limitations) {
        lines.push(`    - ${limitation}`);
      }
    }

    return lines;
  }

  /**
   * Format tool relations for inclusion in a prompt
   *
   * @param relations - The relations to format
   * @returns Array of formatted lines
   * @private
   */
  private formatRelations(relations: ToolRelations): string[] {
    const lines: string[] = [];

    if (relations.requires && relations.requires.length > 0) {
      lines.push(`  Requires: ${relations.requires.join(', ')}`);
    }

    if (relations.suggests && relations.suggests.length > 0) {
      lines.push(`  Suggests: ${relations.suggests.join(', ')}`);
    }

    if (relations.conflicts && relations.conflicts.length > 0) {
      lines.push(`  Conflicts: ${relations.conflicts.join(', ')}`);
    }

    if (relations.follows && relations.follows.length > 0) {
      lines.push(`  Follows: ${relations.follows.join(', ')}`);
    }

    if (relations.precedes && relations.precedes.length > 0) {
      lines.push(`  Precedes: ${relations.precedes.join(', ')}`);
    }

    return lines;
  }
}

