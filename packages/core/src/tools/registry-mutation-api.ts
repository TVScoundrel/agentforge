import type { Tool } from './types.js';
import type { RegistryTool } from './registry-collection.js';
import {
  clearRegistryTools,
  registerManyRegistryTools,
  registerRegistryTool,
  removeRegistryTool,
  updateRegistryTool,
  type RegistryMutationEmitter,
  type RegistryMutationEvents,
} from './registry-mutations.js';

type RegisterManyTool = Tool<never, unknown>;

export interface RegistryMutationApi {
  register<TInput, TOutput>(tool: Tool<TInput, TOutput>): void;
  remove(name: string): boolean;
  update<TInput, TOutput>(name: string, tool: Tool<TInput, TOutput>): boolean;
  registerMany(tools: Iterable<RegisterManyTool>): void;
  clear(): void;
}

export function createRegistryMutationApi<TEvent>(
  tools: Map<string, RegistryTool>,
  emit: RegistryMutationEmitter<TEvent>,
  events: RegistryMutationEvents<TEvent>
): RegistryMutationApi {
  return {
    register: (tool) => registerRegistryTool(tools, tool, emit, events),
    remove: (name) => removeRegistryTool(tools, name, emit, events),
    update: (name, tool) => updateRegistryTool(tools, name, tool, emit, events),
    registerMany: (toolsToRegister) => registerManyRegistryTools(tools, toolsToRegister, emit, events),
    clear: () => clearRegistryTools(tools, emit, events),
  };
}
