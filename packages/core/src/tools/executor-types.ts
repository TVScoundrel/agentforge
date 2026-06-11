export type Priority = 'low' | 'normal' | 'high' | 'critical';

export type BackoffStrategy = 'linear' | 'exponential' | 'fixed';

export interface RetryPolicy {
  maxAttempts: number;
  backoff: BackoffStrategy;
  initialDelay?: number;
  maxDelay?: number;
  retryableErrors?: string[];
}

export interface ExecutableTool<TInput = unknown, TOutput = unknown> {
  metadata?: {
    name?: string;
  };
  invoke?: (input: TInput) => Promise<TOutput>;
  execute?: (input: TInput) => Promise<TOutput>;
}

export interface ToolExecutorConfig {
  maxConcurrent?: number;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  priorityFn?: (tool: ExecutableTool) => Priority;
  onExecutionStart?: (tool: ExecutableTool, input: unknown) => void;
  onExecutionComplete?: (
    tool: ExecutableTool,
    input: unknown,
    result: unknown,
    duration: number
  ) => void;
  onExecutionError?: (
    tool: ExecutableTool,
    input: unknown,
    error: Error,
    duration: number
  ) => void;
}

export interface ToolExecution {
  tool: ExecutableTool;
  input: unknown;
  priority?: Priority;
}

export interface ExecutionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalDuration: number;
  averageDuration: number;
  byPriority: Record<Priority, number>;
}

export interface QueuedExecution extends ToolExecution {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  priority: Priority;
  timestamp: number;
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};
