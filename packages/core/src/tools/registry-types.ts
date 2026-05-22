import type { RegistryEventHandler } from './registry-events.js';
import type { RegistryPromptOptions } from './registry-prompt.js';

export enum RegistryEvent {
  TOOL_REGISTERED = 'tool:registered',
  TOOL_REMOVED = 'tool:removed',
  TOOL_UPDATED = 'tool:updated',
  REGISTRY_CLEARED = 'registry:cleared',
}

export type EventHandler = RegistryEventHandler;

// Preserves the historical public interface name while delegating its shape.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PromptOptions extends RegistryPromptOptions {}
