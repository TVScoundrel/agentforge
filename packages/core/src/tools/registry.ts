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

import { Tool, ToolCategory } from './types.js';
import type { DynamicStructuredTool } from '@langchain/core/tools';
import {
  getAllRegistryTools,
  getRegistryToolNames,
  getRegistryToolsByCategory,
  getRegistryToolsByTag,
  searchRegistryTools,
} from './registry-collection.js';
import {
  addRegistryEventHandler,
  emitRegistryEvent,
  removeRegistryEventHandler,
  type RegistryEventHandler,
} from './registry-events.js';
import {
  clearRegistryTools,
  registerManyRegistryTools,
  registerRegistryTool,
  removeRegistryTool,
  updateRegistryTool,
} from './registry-mutations.js';
import {
  convertRegistryToolsToLangChain,
  generateRegistryPrompt,
  type RegistryPromptOptions,
} from './registry-prompt.js';

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
export type EventHandler = RegistryEventHandler;

// Use `never` for erased input so heterogeneous Tool<TInput, TOutput> values
// remain assignable through the contravariant invoke parameter.
type RegisterManyTool = Tool<never, unknown>;
type RegistryTool = Tool<unknown, unknown>;

/**
 * Options for generating tool prompts
 */
export interface PromptOptions extends RegistryPromptOptions {
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
  private tools: Map<string, RegistryTool> = new Map();
  private eventHandlers: Map<RegistryEvent, Set<EventHandler>> = new Map();
  private readonly mutationEvents = {
    registered: RegistryEvent.TOOL_REGISTERED,
    removed: RegistryEvent.TOOL_REMOVED,
    updated: RegistryEvent.TOOL_UPDATED,
    cleared: RegistryEvent.REGISTRY_CLEARED,
  } as const;
  private readonly emitMutation = (event: RegistryEvent, data: unknown): void => {
    this.emit(event, data);
  };

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
  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    registerRegistryTool(this.tools, tool, this.emitMutation, this.mutationEvents);
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
  get(name: string): RegistryTool | undefined {
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
    return removeRegistryTool(this.tools, name, this.emitMutation, this.mutationEvents);
  }

  /**
   * Update an existing tool
   *
   * @param name - The tool name
   * @param tool - The new tool definition
   * @returns True if updated, false if the tool didn't exist
   * @throws Error if the tool's metadata.name doesn't match the name parameter
   *
   * @example
   * ```ts
   * const updated = registry.update('read-file', newReadFileTool);
  * ```
  */
  update<TInput, TOutput>(name: string, tool: Tool<TInput, TOutput>): boolean {
    return updateRegistryTool(this.tools, name, tool, this.emitMutation, this.mutationEvents);
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
  getAll(): RegistryTool[] {
    return getAllRegistryTools(this.tools);
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
  getByCategory(category: ToolCategory): RegistryTool[] {
    return getRegistryToolsByCategory(this.tools, category);
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
  getByTag(tag: string): RegistryTool[] {
    return getRegistryToolsByTag(this.tools, tag);
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
  search(query: string): RegistryTool[] {
    return searchRegistryTools(this.tools, query);
  }

  /**
   * Register multiple tools at once
   *
   * @param tools - Iterable of tools to register
   * @throws Error if any tool name conflicts with existing tools
   *
   * @example
   * ```ts
   * registry.registerMany([tool1, tool2, tool3]);
  * ```
  */
  registerMany(tools: Iterable<RegisterManyTool>): void {
    registerManyRegistryTools(this.tools, tools, this.emitMutation, this.mutationEvents);
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
    clearRegistryTools(this.tools, this.emitMutation, this.mutationEvents);
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
    return getRegistryToolNames(this.tools);
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
    addRegistryEventHandler(this.eventHandlers, event, handler);
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
    removeRegistryEventHandler(this.eventHandlers, event, handler);
  }

  /**
   * Emit an event to all registered handlers
   *
   * @param event - The event to emit
   * @param data - The event data
   * @private
   */
  private emit(event: RegistryEvent, data: unknown): void {
    emitRegistryEvent(this.eventHandlers, event, data);
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
    return convertRegistryToolsToLangChain(this.getAll());
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
    return generateRegistryPrompt(this.getAll(), options);
  }
}
