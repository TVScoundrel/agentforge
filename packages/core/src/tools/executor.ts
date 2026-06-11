/**
 * Tool Executor - Async tool execution with resource management
 * @module tools/executor
 */

import { createLogger } from '../langgraph/observability/logger.js';
import {
  createExecutionMetrics,
  recordExecutionResult,
  resetExecutionMetrics,
  snapshotExecutionMetrics,
} from './executor-metrics.js';
import { executeWithRetry, toError } from './executor-retry.js';
import {
  PRIORITY_ORDER,
  type ExecutableTool,
  type ExecutionMetrics,
  type Priority,
  type QueuedExecution,
  type ToolExecution,
  type ToolExecutorConfig,
} from './executor-types.js';

const logger = createLogger('agentforge:core:tools:executor');

export type {
  BackoffStrategy,
  ExecutableTool,
  ExecutionMetrics,
  Priority,
  RetryPolicy,
  ToolExecution,
  ToolExecutorConfig,
} from './executor-types.js';

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
  const metrics = createExecutionMetrics();

  async function executeSingle(
    tool: ExecutableTool,
    input: unknown,
    priority: Priority
  ): Promise<unknown> {
    const startTime = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      onExecutionStart?.(tool, input);

      const result = await Promise.race([
        executeWithRetry(tool, input, retryPolicy, logger),
        new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Tool execution timeout')), timeout);
        }),
      ]);

      const duration = Date.now() - startTime;
      recordExecutionResult(metrics, priority, duration, true);
      onExecutionComplete?.(tool, input, result, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const normalizedError = toError(error);

      recordExecutionResult(metrics, priority, duration, false);
      onExecutionError?.(tool, input, normalizedError, duration);
      throw normalizedError;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  function processQueue(): void {
    while (queue.length > 0 && activeExecutions < maxConcurrent) {
      queue.sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return a.timestamp - b.timestamp;
      });

      const execution = queue.shift();
      if (!execution) {
        break;
      }

      activeExecutions++;

      executeSingle(execution.tool, execution.input, execution.priority)
        .then((result) => {
          execution.resolve(result);
        })
        .catch((error) => {
          execution.reject(error);
        })
        .finally(() => {
          activeExecutions--;
          processQueue();
        });
    }
  }

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

  async function executeParallel(executions: ToolExecution[]): Promise<unknown[]> {
    return Promise.all(
      executions.map((execution) =>
        execute(execution.tool, execution.input, { priority: execution.priority })
      )
    );
  }

  function getMetrics(): ExecutionMetrics {
    return snapshotExecutionMetrics(metrics);
  }

  function resetMetrics(): void {
    resetExecutionMetrics(metrics);
  }

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
