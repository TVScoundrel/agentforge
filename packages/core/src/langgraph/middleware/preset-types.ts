import type { Logger } from '../observability/logger.js';
import type { ErrorHandlerOptions } from './error-handler.js';
import type { RetryOptions } from './retry.js';
import type { NodeFunction } from './types.js';

export interface ProductionPresetOptions<State> {
  nodeName: string;
  logger?: Logger;
  enableMetrics?: boolean;
  enableTracing?: boolean;
  enableRetry?: boolean;
  timeout?: number;
  retryOptions?: Partial<RetryOptions>;
  errorOptions?: Partial<ErrorHandlerOptions<State>>;
}

export interface DevelopmentPresetOptions {
  nodeName: string;
  verbose?: boolean;
  logger?: Logger;
}

export interface TestingPresetOptions<State> {
  nodeName: string;
  mockResponse?: Partial<State>;
  simulateError?: Error;
  delay?: number;
  trackInvocations?: boolean;
}

export type TestingPresetNode<State> = NodeFunction<State> & { invocations: State[] };
