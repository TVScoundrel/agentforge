import type { Tool, ToolCategory } from './types.js';
import {
  addRegistryEventHandler,
  emitRegistryEvent,
  removeRegistryEventHandler,
} from './registry-events.js';
import {
  getAllRegistryTools,
  getRegistryToolNames,
  getRegistryToolsByCategory,
  getRegistryToolsByTag,
  searchRegistryTools,
  type RegistryInputTool,
  type RegistryTool,
} from './registry-collection.js';
import {
  clearRegistryTools,
  registerManyRegistryTools,
  registerRegistryTool,
  removeRegistryTool,
  updateRegistryTool,
  type RegistryMutationEvents,
} from './registry-mutations.js';
import { convertRegistryToolsToLangChain, generateRegistryPrompt } from './registry-prompt.js';
import { RegistryEvent, type EventHandler, type PromptOptions } from './registry-types.js';

export class ToolRegistry {
  private tools: Map<string, RegistryTool> = new Map();
  private eventHandlers: Map<RegistryEvent, Set<EventHandler>> = new Map();
  private readonly mutationEvents: RegistryMutationEvents<RegistryEvent> = {
    registered: RegistryEvent.TOOL_REGISTERED,
    removed: RegistryEvent.TOOL_REMOVED,
    updated: RegistryEvent.TOOL_UPDATED,
    cleared: RegistryEvent.REGISTRY_CLEARED,
  };
  private readonly emitMutation = (event: RegistryEvent, data: unknown): void => {
    this.emit(event, data);
  };

  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    registerRegistryTool(this.tools, tool, this.emitMutation, this.mutationEvents);
  }

  get(name: string): RegistryTool | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  remove(name: string): boolean {
    return removeRegistryTool(this.tools, name, this.emitMutation, this.mutationEvents);
  }

  update<TInput, TOutput>(name: string, tool: Tool<TInput, TOutput>): boolean {
    return updateRegistryTool(this.tools, name, tool, this.emitMutation, this.mutationEvents);
  }

  getAll(): RegistryTool[] {
    return getAllRegistryTools(this.tools);
  }

  getByCategory(category: ToolCategory): RegistryTool[] {
    return getRegistryToolsByCategory(this.tools, category);
  }

  getByTag(tag: string): RegistryTool[] {
    return getRegistryToolsByTag(this.tools, tag);
  }

  search(query: string): RegistryTool[] {
    return searchRegistryTools(this.tools, query);
  }

  registerMany(tools: Iterable<RegistryInputTool>): void {
    registerManyRegistryTools(this.tools, tools, this.emitMutation, this.mutationEvents);
  }

  clear(): void {
    clearRegistryTools(this.tools, this.emitMutation, this.mutationEvents);
  }

  size(): number {
    return this.tools.size;
  }

  getNames(): string[] {
    return getRegistryToolNames(this.tools);
  }

  on(event: RegistryEvent, handler: EventHandler): void {
    addRegistryEventHandler(this.eventHandlers, event, handler);
  }

  off(event: RegistryEvent, handler: EventHandler): void {
    removeRegistryEventHandler(this.eventHandlers, event, handler);
  }

  private emit(event: RegistryEvent, data: unknown): void {
    emitRegistryEvent(this.eventHandlers, event, data);
  }

  toLangChainTools() {
    return convertRegistryToolsToLangChain(getAllRegistryTools(this.tools));
  }

  generatePrompt(options: PromptOptions = {}): string {
    return generateRegistryPrompt(getAllRegistryTools(this.tools), options);
  }
}

export { RegistryEvent };
export type { EventHandler, PromptOptions };
