import type { JsonObject } from '../langgraph/observability/payload.js';
import type { ManagedTool } from './lifecycle.js';

export interface ToolHealthCheckResult {
  healthy: boolean;
  error?: string;
  metadata?: JsonObject;
}

interface ManagedToolConfigBase<TContext, TInput, TOutput> {
  name: string;
  description: string;
  initialize?: (this: ManagedTool<TContext, TInput, TOutput>) => Promise<void>;
  execute: (
    this: ManagedTool<TContext, TInput, TOutput>,
    input: TInput
  ) => Promise<TOutput>;
  cleanup?: (this: ManagedTool<TContext, TInput, TOutput>) => Promise<void>;
  healthCheck?: (
    this: ManagedTool<TContext, TInput, TOutput>
  ) => Promise<ToolHealthCheckResult>;
  autoCleanup?: boolean;
  healthCheckInterval?: number;
}

export interface ManagedToolConfig<TContext = undefined, TInput = unknown, TOutput = unknown>
  extends ManagedToolConfigBase<TContext, TInput, TOutput> {
  context?: TContext;
}

export interface ManagedToolStats {
  initialized: boolean;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionTime?: number;
  lastHealthCheck?: ToolHealthCheckResult;
  lastHealthCheckTime?: number;
}
