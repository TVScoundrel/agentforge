import { Tool } from './types.js';
import type { RegistryTool } from './registry-collection.js';

type RegisterManyTool = Tool<never, unknown>;

export interface RegistryMutationEvents<TEvent> {
  registered: TEvent;
  removed: TEvent;
  updated: TEvent;
  cleared: TEvent;
}

export type RegistryMutationEmitter<TEvent> = (event: TEvent, data: unknown) => void;

function eraseToolType<TInput, TOutput>(tool: Tool<TInput, TOutput>): RegistryTool {
  return tool as unknown as RegistryTool;
}

export function registerRegistryTool<TInput, TOutput, TEvent>(
  tools: Map<string, RegistryTool>,
  tool: Tool<TInput, TOutput>,
  emit: RegistryMutationEmitter<TEvent>,
  events: RegistryMutationEvents<TEvent>
): void {
  const name = tool.metadata.name;

  if (tools.has(name)) {
    throw new Error(
      `Tool with name "${name}" is already registered. Use update() to modify it.`
    );
  }

  tools.set(name, eraseToolType(tool));
  emit(events.registered, tool);
}

export function removeRegistryTool<TEvent>(
  tools: Map<string, RegistryTool>,
  name: string,
  emit: RegistryMutationEmitter<TEvent>,
  events: RegistryMutationEvents<TEvent>
): boolean {
  const tool = tools.get(name);
  if (!tool) {
    return false;
  }

  tools.delete(name);
  emit(events.removed, tool);
  return true;
}

export function updateRegistryTool<TInput, TOutput, TEvent>(
  tools: Map<string, RegistryTool>,
  name: string,
  tool: Tool<TInput, TOutput>,
  emit: RegistryMutationEmitter<TEvent>,
  events: RegistryMutationEvents<TEvent>
): boolean {
  if (!tools.has(name)) {
    return false;
  }

  if (tool.metadata.name !== name) {
    throw new Error(
      `Cannot update tool: metadata.name "${tool.metadata.name}" does not match registry key "${name}". ` +
      `To rename a tool, remove it and register it again with the new name.`
    );
  }

  tools.set(name, eraseToolType(tool));
  emit(events.updated, { name, tool });
  return true;
}

export function registerManyRegistryTools<TEvent>(
  tools: Map<string, RegistryTool>,
  toolsToRegister: Iterable<RegisterManyTool>,
  emit: RegistryMutationEmitter<TEvent>,
  events: RegistryMutationEvents<TEvent>
): void {
  const pendingTools = Array.from(toolsToRegister);
  const inputNames = new Set<string>();
  const duplicatesInInput = new Set<string>();

  for (const tool of pendingTools) {
    const name = tool.metadata.name;
    if (inputNames.has(name)) {
      duplicatesInInput.add(name);
    } else {
      inputNames.add(name);
    }
  }

  if (duplicatesInInput.size > 0) {
    throw new Error(
      `Cannot register tools: duplicate names in input list: ${Array.from(duplicatesInInput).join(', ')}`
    );
  }

  const conflicts: string[] = [];
  for (const tool of pendingTools) {
    if (tools.has(tool.metadata.name)) {
      conflicts.push(tool.metadata.name);
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Cannot register tools: the following names already exist: ${conflicts.join(', ')}`
    );
  }

  for (const tool of pendingTools) {
    registerRegistryTool(tools, tool, emit, events);
  }
}

export function clearRegistryTools<TEvent>(
  tools: Map<string, RegistryTool>,
  emit: RegistryMutationEmitter<TEvent>,
  events: RegistryMutationEvents<TEvent>
): void {
  tools.clear();
  emit(events.cleared, null);
}
