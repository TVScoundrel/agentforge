/**
 * Tool Executor - Async tool execution with resource management
 * @module tools/executor
 */

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
  priorityFn?: (tool: any) => Priority;
  onExecutionStart?: (tool: any, input: any) => void;
  onExecutionComplete?: (tool: any, input: any, result: any, duration: number) => void;
  onExecutionError?: (tool: any, input: any, error: Error, duration: number) => void;
}

export interface ToolExecution {
  tool: any;
  input: any;
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
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  priority: Priority;
  timestamp: number;
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

  /**
   * Execute a tool with retry logic
   */
  async function executeWithRetry(
    tool: any,
    input: any,
    policy?: RetryPolicy
  ): Promise<any> {
    // Use invoke if available (LangChain compatibility), otherwise use execute (required)
    const executeFn = tool.invoke || tool.execute;

    if (!executeFn) {
      throw new Error('Tool must implement either invoke() or execute() method');
    }

    if (!policy) {
      return await executeFn.call(tool, input);
    }

    let lastError: Error | undefined;
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        return await executeFn.call(tool, input);
      } catch (error) {
        lastError = error as Error;

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
    tool: any,
    input: any,
    priority: Priority
  ): Promise<any> {
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

      // Update metrics
      metrics.totalExecutions++;
      metrics.failedExecutions++;
      metrics.totalDuration += duration;
      metrics.averageDuration = metrics.totalDuration / metrics.totalExecutions;

      onExecutionError?.(tool, input, error as Error, duration);

      throw error;
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
    tool: any,
    input: any,
    options: { priority?: Priority } = {}
  ): Promise<any> {
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
  async function executeParallel(executions: ToolExecution[]): Promise<any[]> {
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


