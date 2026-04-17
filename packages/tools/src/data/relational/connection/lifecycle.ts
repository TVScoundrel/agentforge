import type { DatabaseVendor } from '../types.js';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export interface ReconnectionConfig {
  /** Enable automatic reconnection on connection loss. */
  enabled: boolean;
  /** Maximum number of reconnection attempts (0 = infinite). */
  maxAttempts: number;
  /** Base delay in milliseconds for exponential backoff. */
  baseDelayMs: number;
  /** Maximum delay in milliseconds between reconnection attempts. */
  maxDelayMs: number;
}

export interface ReconnectingEventPayload {
  attempt: number;
  maxAttempts: number;
  delayMs: number;
}

export interface ConnectionLifecycleLogger {
  debug(message: string, metadata?: unknown): void;
  info(message: string, metadata?: unknown): void;
  error(message: string, metadata?: unknown): void;
}

export interface ScheduledReconnectionContext {
  vendor: DatabaseVendor;
  reconnectionConfig: ReconnectionConfig;
  reconnectionAttempts: number;
  setReconnectionAttempts(attempts: number): void;
  setState(state: ConnectionState): void;
  emitReconnecting(payload: ReconnectingEventPayload): void;
  initialize(): Promise<void>;
  connectPromise: Promise<void> | null;
  setConnectPromise(promise: Promise<void> | null): void;
  reconnectionTimer: NodeJS.Timeout | null;
  setReconnectionTimer(timer: NodeJS.Timeout | null): void;
}

export function cancelPendingReconnection(
  timer: NodeJS.Timeout | null,
  logger: ConnectionLifecycleLogger,
  vendor: DatabaseVendor,
  message: string
): NodeJS.Timeout | null {
  if (!timer) {
    return null;
  }

  logger.debug(message, { vendor });
  clearTimeout(timer);
  return null;
}

export async function waitForInFlightConnection(
  promise: Promise<void> | null,
  logger: ConnectionLifecycleLogger,
  vendor: DatabaseVendor,
  phase: 'disconnect' | 'close'
): Promise<null> {
  if (!promise) {
    return null;
  }

  logger.debug(`Waiting for in-flight connection attempt to complete before ${phase}`, {
    vendor,
  });
  try {
    await promise;
  } catch {
    // Ignore in-flight connection errors during shutdown paths.
  }
  return null;
}

export function shutdownClient(
  vendor: DatabaseVendor,
  client: unknown
): Promise<void> | void {
  if (vendor === 'postgresql' || vendor === 'mysql') {
    return (client as { end(): Promise<void> }).end();
  }

  if (vendor === 'sqlite') {
    (client as { close(): void }).close();
  }
}

export function scheduleReconnection(
  context: ScheduledReconnectionContext,
  logger: ConnectionLifecycleLogger
): void {
  if (
    context.reconnectionConfig.maxAttempts > 0 &&
    context.reconnectionAttempts >= context.reconnectionConfig.maxAttempts
  ) {
    logger.error('Max reconnection attempts reached', {
      vendor: context.vendor,
      attempts: context.reconnectionAttempts,
      maxAttempts: context.reconnectionConfig.maxAttempts,
    });
    return;
  }

  const delay = Math.min(
    context.reconnectionConfig.baseDelayMs * Math.pow(2, context.reconnectionAttempts),
    context.reconnectionConfig.maxDelayMs
  );

  const nextAttempt = context.reconnectionAttempts + 1;
  context.setReconnectionAttempts(nextAttempt);
  context.setState(ConnectionState.RECONNECTING);

  logger.info('Scheduling reconnection attempt', {
    vendor: context.vendor,
    attempt: nextAttempt,
    maxAttempts: context.reconnectionConfig.maxAttempts,
    delayMs: delay,
  });

  context.emitReconnecting({
    attempt: nextAttempt,
    maxAttempts: context.reconnectionConfig.maxAttempts,
    delayMs: delay,
  });

  const timer = setTimeout(async () => {
    context.setReconnectionTimer(null);

    try {
      logger.info('Attempting reconnection', {
        vendor: context.vendor,
        attempt: context.reconnectionAttempts,
      });

      const promise = context.initialize().finally(() => {
        context.setConnectPromise(null);
      });

      context.setConnectPromise(promise);
      await promise;
    } catch (error) {
      logger.error('Reconnection attempt failed', {
        vendor: context.vendor,
        attempt: context.reconnectionAttempts,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, delay);

  context.setReconnectionTimer(timer);
}
