import type { Tool, ToolCategory } from './types.js';
import {
  addRegistryEventHandler,
  emitRegistryEvent,
  removeRegistryEventHandler,
} from './registry-events.js';
import type { RegistryTool } from './registry-collection.js';
import { createRegistryMutationApi, type RegistryMutationApi } from './registry-mutation-api.js';
import type { RegistryMutationEvents } from './registry-mutations.js';
import { createRegistryQueryApi, type RegistryQueryApi } from './registry-query-api.js';
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
  private readonly mutations: RegistryMutationApi;
  private readonly queries: RegistryQueryApi;

  constructor() {
    this.mutations = createRegistryMutationApi(this.tools, this.emitMutation, this.mutationEvents);
    this.queries = createRegistryQueryApi(this.tools);
  }

  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void {
    this.mutations.register(tool);
  }

  get(name: string): RegistryTool | undefined {
    return this.queries.get(name);
  }

  has(name: string): boolean {
    return this.queries.has(name);
  }

  remove(name: string): boolean {
    return this.mutations.remove(name);
  }

  update<TInput, TOutput>(name: string, tool: Tool<TInput, TOutput>): boolean {
    return this.mutations.update(name, tool);
  }

  getAll(): RegistryTool[] {
    return this.queries.getAll();
  }

  getByCategory(category: ToolCategory): RegistryTool[] {
    return this.queries.getByCategory(category);
  }

  getByTag(tag: string): RegistryTool[] {
    return this.queries.getByTag(tag);
  }

  search(query: string): RegistryTool[] {
    return this.queries.search(query);
  }

  registerMany(tools: Iterable<Tool<never, unknown>>): void {
    this.mutations.registerMany(tools);
  }

  clear(): void {
    this.mutations.clear();
  }

  size(): number {
    return this.queries.size();
  }

  getNames(): string[] {
    return this.queries.getNames();
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
    return this.queries.toLangChainTools();
  }

  generatePrompt(options: PromptOptions = {}): string {
    return this.queries.generatePrompt(options);
  }
}

export { RegistryEvent };
export type { EventHandler, PromptOptions };
