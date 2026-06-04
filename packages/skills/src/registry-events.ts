import { createLogger, LogLevel } from '@agentforge/core';
import type { SkillEventHandler } from './types.js';
import { SkillRegistryEvent } from './types.js';
import type { RegistryEventHandlers } from './registry-internal.js';

const logger = createLogger('agentforge:skills:registry', { level: LogLevel.INFO });

export function addRegistryEventHandler(
  eventHandlers: RegistryEventHandlers,
  event: SkillRegistryEvent,
  handler: SkillEventHandler,
): void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }

  eventHandlers.get(event)!.add(handler);
}

export function removeRegistryEventHandler(
  eventHandlers: RegistryEventHandlers,
  event: SkillRegistryEvent,
  handler: SkillEventHandler,
): void {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    handlers.delete(handler);
  }
}

export function emitRegistryEvent(
  eventHandlers: RegistryEventHandlers,
  event: SkillRegistryEvent,
  data: unknown,
): void {
  const handlers = eventHandlers.get(event);
  if (!handlers) {
    return;
  }

  handlers.forEach((handler) => {
    try {
      handler(data);
    } catch (error) {
      logger.error('Skill event handler error', {
        event,
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
      });
    }
  });
}
