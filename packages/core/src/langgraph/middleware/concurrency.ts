import type { NodeFunction } from './types.js';

/**
 * Priority level for queued tasks
 */
export type Priority = 'low' | 'normal' | 'high';

/**
 * Queued task
 */
interface QueuedTask<State> {
  state: State;
  priority: Priority;
  executor: (state: State) => Promise<State | Partial<State>>;
  resolve: (value: State | Partial<State>) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

/**
 * Concurrency control options
 */
export interface ConcurrencyOptions<State> {
  /**
   * Maximum number of concurrent executions
   * @default 1
   */
  maxConcurrent?: number;

  /**
   * Maximum queue size (0 = unlimited)
   * @default 0
   */
  maxQueueSize?: number;

  /**
   * Priority function to determine task priority
   * @default () => 'normal'
   */
  priorityFn?: (state: State) => Priority;

  /**
   * Callback when task is queued
   */
  onQueued?: (queueSize: number, state: State) => void;

  /**
   * Callback when task starts executing
   */
  onExecutionStart?: (activeCount: number, state: State) => void;

  /**
   * Callback when task completes
   */
  onExecutionComplete?: (activeCount: number, state: State) => void;

  /**
   * Callback when queue is full
   */
  onQueueFull?: (state: State) => void;

  /**
   * Timeout for queued tasks (ms)
   * @default 0 (no timeout)
   */
  queueTimeout?: number;
}

/**
 * Concurrency controller
 */
class ConcurrencyController<State> {
  private activeCount = 0;
  private queue: QueuedTask<State>[] = [];

  constructor(
    private maxConcurrent: number,
    private maxQueueSize: number,
    private onQueued?: (queueSize: number, state: State) => void,
    private onExecutionStart?: (activeCount: number, state: State) => void,
    private onExecutionComplete?: (activeCount: number, state: State) => void,
    private onQueueFull?: (state: State) => void,
    private queueTimeout?: number
  ) {}

  async execute(
    state: State,
    priority: Priority,
    executor: (state: State) => Promise<State | Partial<State>>
  ): Promise<State | Partial<State>> {
    // Check if we can execute immediately
    if (this.activeCount < this.maxConcurrent) {
      return this.executeTask(state, executor);
    }

    // Check queue size limit
    if (this.maxQueueSize > 0 && this.queue.length >= this.maxQueueSize) {
      if (this.onQueueFull) {
        this.onQueueFull(state);
      }
      throw new Error(`Queue is full (max size: ${this.maxQueueSize})`);
    }

    // Queue the task
    return new Promise<State | Partial<State>>((resolve, reject) => {
      const task: QueuedTask<State> = {
        state,
        priority,
        executor,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      // Insert task based on priority
      this.insertByPriority(task);

      if (this.onQueued) {
        this.onQueued(this.queue.length, state);
      }

      // Set timeout if configured
      if (this.queueTimeout && this.queueTimeout > 0) {
        setTimeout(() => {
          const index = this.queue.indexOf(task);
          if (index !== -1) {
            this.queue.splice(index, 1);
            reject(new Error(`Task timed out after ${this.queueTimeout}ms in queue`));
          }
        }, this.queueTimeout);
      }
    });
  }

  private insertByPriority(task: QueuedTask<State>): void {
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    const taskPriorityValue = priorityOrder[task.priority];

    // Find insertion point
    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const queuedPriorityValue = priorityOrder[this.queue[i].priority];
      if (taskPriorityValue < queuedPriorityValue) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, task);
  }

  private async executeTask(
    state: State,
    executor: (state: State) => Promise<State | Partial<State>>
  ): Promise<State | Partial<State>> {
    this.activeCount++;

    if (this.onExecutionStart) {
      this.onExecutionStart(this.activeCount, state);
    }

    try {
      const result = await executor(state);

      if (this.onExecutionComplete) {
        this.onExecutionComplete(this.activeCount - 1, state);
      }

      return result;
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.queue.length === 0 || this.activeCount >= this.maxConcurrent) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      // Execute the queued task
      this.executeTask(task.state, task.executor)
        .then(task.resolve)
        .catch(task.reject);
    }
  }

  getStats() {
    return {
      activeCount: this.activeCount,
      queueSize: this.queue.length,
    };
  }

  clear() {
    this.queue.forEach((task) => {
      task.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

/**
 * Concurrency control middleware
 */
export function withConcurrency<State>(
  node: NodeFunction<State>,
  options: ConcurrencyOptions<State> = {}
): NodeFunction<State> {
  const {
    maxConcurrent = 1,
    maxQueueSize = 0,
    priorityFn = () => 'normal' as Priority,
    onQueued,
    onExecutionStart,
    onExecutionComplete,
    onQueueFull,
    queueTimeout = 0,
  } = options;

  const controller = new ConcurrencyController<State>(
    maxConcurrent,
    maxQueueSize,
    onQueued,
    onExecutionStart,
    onExecutionComplete,
    onQueueFull,
    queueTimeout
  );

  return async (state: State): Promise<State | Partial<State>> => {
    const priority = priorityFn(state);
    return controller.execute(state, priority, async (s) => await node(s));
  };
}

/**
 * Create a shared concurrency controller
 */
export function createSharedConcurrencyController<State>(
  options: ConcurrencyOptions<State> = {}
): {
  withConcurrency: (node: NodeFunction<State>) => NodeFunction<State>;
  getStats: () => { activeCount: number; queueSize: number };
  clear: () => void;
} {
  const {
    maxConcurrent = 1,
    maxQueueSize = 0,
    priorityFn = () => 'normal' as Priority,
    onQueued,
    onExecutionStart,
    onExecutionComplete,
    onQueueFull,
    queueTimeout = 0,
  } = options;

  const controller = new ConcurrencyController<State>(
    maxConcurrent,
    maxQueueSize,
    onQueued,
    onExecutionStart,
    onExecutionComplete,
    onQueueFull,
    queueTimeout
  );

  return {
    withConcurrency: (node: NodeFunction<State>) => {
      return async (state: State): Promise<State | Partial<State>> => {
        const priority = priorityFn(state);
        return controller.execute(state, priority, async (s) => await node(s));
      };
    },
    getStats: () => controller.getStats(),
    clear: () => controller.clear(),
  };
}

