import { createLogger, LogLevel } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:core:tools:registry', { level: LogLevel.INFO });

export type RegistryEventHandler<TData = unknown> = (data: TData) => void;

export function addRegistryEventHandler<TEvent, TData>(
  eventHandlers: Map<TEvent, Set<RegistryEventHandler<TData>>>,
  event: TEvent,
  handler: RegistryEventHandler<TData>
): void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set());
  }

  eventHandlers.get(event)!.add(handler);
}

export function removeRegistryEventHandler<TEvent, TData>(
  eventHandlers: Map<TEvent, Set<RegistryEventHandler<TData>>>,
  event: TEvent,
  handler: RegistryEventHandler<TData>
): void {
  const handlers = eventHandlers.get(event);
  if (handlers) {
    handlers.delete(handler);
  }
}

export function emitRegistryEvent<TEvent>(
  eventHandlers: Map<TEvent, Set<RegistryEventHandler>>,
  event: TEvent,
  data: unknown
): void {
  const handlers = eventHandlers.get(event);
  if (!handlers) {
    return;
  }

  handlers.forEach((handler) => {
    try {
      handler(data);
    } catch (error) {
      logger.error('Event handler error', {
        event: String(event),
        error: error instanceof Error ? error.message : String(error),
        ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
      });
    }
  });
}
