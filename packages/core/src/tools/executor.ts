/**
 * Tool Executor - Async tool execution with resource management
 * @module tools/executor
 */

import { createLogger } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:tools:executor');

export type Priority = 'low' | 'normal' | 'high' | 'critical';

export type BackoffStrategy = 'linear' | 'exponential' | 'fixed';

export interface RetryPolicy {
  maxAttempts: number;
  backoff: BackoffStrategy;
  initialDelay?: number;
  maxDelay?: number;
  retryableErrors?: string[];
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

interface QueuedExecution extends ToolExecution {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  priority: Priority;
  timestamp: number;
}

export interface ExecutableTool<TInput = unknown, TOutput = unknown> {
  metadata?: {
    name?: string;
  };
  invoke?: (input: TInput) => Promise<TOutput>;
  execute?: (input: TInput) => Promise<TOutput>;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Create a tool executor with resource management
 */
export function createToolExecutor(config: ToolExecutorConfig = {}) {
  const {
    maxConcurrent = 5,
    timeout = 30000,
    retryPolicy,
    priorityFn = () => 'normal',
    onExecutionStart,
    onExecutionComplete,
    onExecutionError,
  } = config;

  let activeExecutions = 0;
  const queue: QueuedExecution[] = [];
  const metrics: ExecutionMetrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalDuration: 0,
    averageDuration: 0,
    byPriority: { low: 0, normal: 0, high: 0, critical: 0 },
  };

  /**
   * Calculate backoff delay for retry
   */
  function calculateBackoff(attempt: number, policy: RetryPolicy): number {
    const initialDelay = policy.initialDelay || 1000;
    const maxDelay = policy.maxDelay || 30000;

    let delay: number;
    switch (policy.backoff) {
      case 'linear':
        delay = initialDelay * attempt;
        break;
      case 'exponential':
        delay = initialDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = initialDelay;
    }

    return Math.min(delay, maxDelay);
  }

  function toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    return new Error(String(error));
  }

  /**
   * Execute a tool with retry logic
   */
  async function executeWithRetry(
    tool: ExecutableTool,
    input: unknown,
    policy?: RetryPolicy
  ): Promise<unknown> {
    // Require invoke() as the primary method (industry standard)
    // Fall back to execute() only for backward compatibility with tools created before v0.11.0
    const executeFn = tool.invoke || tool.execute;

    if (!executeFn) {
      throw new Error(
        'Tool must implement invoke() method. ' +
        'Tools created with createTool() or toolBuilder automatically have this method. ' +
        'If you are manually constructing a tool, ensure it has an invoke() method.'
      );
    }

    // Warn if tool only has execute() (violates the type contract since v0.11.0)
    if (!tool.invoke && tool.execute) {
      logger.warn(
        `Tool "${tool.metadata?.name || 'unknown'}" only implements execute() which is deprecated. ` +
        'Please update to implement invoke() as the primary method. ' +
        'execute() will be removed in v1.0.0.'
      );
    }

    if (!policy) {
      return await executeFn.call(tool, input);
    }

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await executeFn.call(tool, input);
      } catch (error) {
        lastError = toError(error);

        // Check if error is retryable
        if (policy.retryableErrors && policy.retryableErrors.length > 0) {
          const isRetryable = policy.retryableErrors.some((msg) =>
            lastError!.message.includes(msg)
          );
          if (!isRetryable) {
            throw lastError;
          }
        }

        // Don't wait after last attempt
        if (attempt < policy.maxAttempts) {
          const delay = calculateBackoff(attempt, policy);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute a single tool
   */
  async function executeSingle(
    tool: ExecutableTool,
    input: unknown,
    priority: Priority
  ): Promise<unknown> {
    const startTime = Date.now();

    try {
      onExecutionStart?.(tool, input);

      // Execute with timeout
      const result = await Promise.race([
        executeWithRetry(tool, input, retryPolicy),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
        ),
      ]);

      const duration = Date.now() - startTime;

      // Update metrics
      metrics.totalExecutions++;
      metrics.successfulExecutions++;
      metrics.totalDuration += duration;
      metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
      metrics.byPriority[priority]++;

      onExecutionComplete?.(tool, input, result, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const normalizedError = toError(error);

      // Update metrics
      metrics.totalExecutions++;
      metrics.failedExecutions++;
      metrics.totalDuration += duration;
      metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;
      metrics.byPriority[priority]++;

      onExecutionError?.(tool, input, normalizedError, duration);
      throw normalizedError;
    }
  }

  /**
   * Process the queue
   */
  async function processQueue() {
    while (queue.length > 0 && activeExecutions < maxConcurrent) {
      // Sort queue by priority
      queue.sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp; // FIFO for same priority
      });

      const execution = queue.shift();
      if (!execution) break;

      activeExecutions++;

      // Execute asynchronously
      executeSingle(execution.tool, execution.input, execution.priority)
        .then((result) => {
          execution.resolve(result);
        })
        .catch((error) => {
          execution.reject(error);
        })
        .finally(() => {
          activeExecutions--;
          processQueue(); // Process next item
        });
    }
  }

  /**
   * Execute a tool
   */
  async function execute(
    tool: ExecutableTool,
    input: unknown,
    options: { priority?: Priority } = {}
  ): Promise<unknown> {
    const priority = options.priority || priorityFn(tool);

    return new Promise((resolve, reject) => {
      queue.push({
        tool,
        input,
        priority,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      processQueue();
    });
  }

  /**
   * Execute multiple tools in parallel
   */
  async function executeParallel(executions: ToolExecution[]): Promise<unknown[]> {
    return Promise.all(
      executions.map((exec) =>
        execute(exec.tool, exec.input, { priority: exec.priority })
      )
    );
  }

  /**
   * Get execution metrics
   */
  function getMetrics(): ExecutionMetrics {
    return { ...metrics };
  }

  /**
   * Reset metrics
   */
  function resetMetrics(): void {
    metrics.totalExecutions = 0;
    metrics.successfulExecutions = 0;
    metrics.failedExecutions = 0;
    metrics.totalDuration = 0;
    metrics.averageDuration = 0;
    metrics.byPriority = { low: 0, normal: 0, high: 0, critical: 0 };
  }

  /**
   * Get queue status
   */
  function getQueueStatus() {
    return {
      queueLength: queue.length,
      activeExecutions,
      maxConcurrent,
    };
  }

  return {
    execute,
    executeParallel,
    getMetrics,
    resetMetrics,
    getQueueStatus,
  };
}
