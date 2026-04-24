/**
 * Tool Lifecycle Management - Manage tool initialization, cleanup, and resources
 * @module tools/lifecycle
 */

import type { JsonObject } from '../langgraph/observability/payload.js';
import { createLogger, LogLevel } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:core:tools:lifecycle', { level: LogLevel.INFO });

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

/**
 * Managed tool with lifecycle hooks
 */
export class ManagedTool<TContext = undefined, TInput = unknown, TOutput = unknown> {
  public readonly name: string;
  public readonly description: string;
  private readonly initializeFn?: () => Promise<void>;
  private readonly executeFn: (input: TInput) => Promise<TOutput>;
  private readonly cleanupFn?: () => Promise<void>;
  private readonly healthCheckFn?: () => Promise<ToolHealthCheckResult>;
  private readonly autoCleanup: boolean;
  private readonly healthCheckInterval?: number;

  private _initialized = false;
  private _context: TContext | undefined;
  private _stats: ManagedToolStats = {
    initialized: false,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
  };
  private _healthCheckTimer?: NodeJS.Timeout;
  private _beforeExitHandler?: () => void;
  private _healthCheckInFlight = false;
  private _cleaningUp = false;
  private _cleanupPromise?: Promise<void>;
  private _lifecycleGeneration = 0;

  constructor(config: ManagedToolConfig<TContext, TInput, TOutput>) {
    this.name = config.name;
    this.description = config.description;
    this.initializeFn = config.initialize?.bind(this);
    this.executeFn = config.execute.bind(this);
    this.cleanupFn = config.cleanup?.bind(this);
    this.healthCheckFn = config.healthCheck?.bind(this);
    this.autoCleanup = config.autoCleanup ?? true;
    this.healthCheckInterval = config.healthCheckInterval;
    this._context = config.context;

    this.ensureBeforeExitHandler();
  }

  /**
   * Get the tool context (e.g., connection pool, API client)
   */
  get context(): TContext | undefined {
    return this._context;
  }

  /**
   * Set the tool context
   */
  set context(value: TContext | undefined) {
    this._context = value;
  }

  /**
   * Check if tool is initialized
   */
  get initialized(): boolean {
    return this._initialized;
  }

  /**
   * Initialize the tool
   */
  async initialize(): Promise<void> {
    if (this._initialized || this._cleaningUp) {
      return;
    }

    this.ensureBeforeExitHandler();
    this._lifecycleGeneration++;

    if (this.initializeFn) {
      await this.initializeFn();
    }

    this._initialized = true;
    this._stats.initialized = true;

    // Start periodic health checks if configured
    if (this.healthCheckInterval && this.healthCheckFn) {
      this._healthCheckTimer = setInterval(() => {
        void this.runPeriodicHealthCheck();
      }, this.healthCheckInterval);
    }
  }

  /**
   * Execute the tool
   */
  async execute(input: TInput): Promise<TOutput> {
    if (!this._initialized) {
      throw new Error(`Tool ${this.name} is not initialized. Call initialize() first.`);
    }

    const startTime = Date.now();
    this._stats.totalExecutions++;

    try {
      const result = await this.executeFn(input);
      this._stats.successfulExecutions++;
      this._stats.lastExecutionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      this._stats.failedExecutions++;
      this._stats.lastExecutionTime = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Cleanup the tool
   */
  async cleanup(): Promise<void> {
    if (this._cleanupPromise) {
      await this._cleanupPromise;
      return;
    }

    const cleanupPromise = this.performCleanup();
    this._cleanupPromise = cleanupPromise;

    try {
      await cleanupPromise;
    } finally {
      this._cleanupPromise = undefined;
    }
  }

  private async performCleanup(): Promise<void> {
    this._cleaningUp = true;

    // Stop health check timer
    if (this._healthCheckTimer) {
      clearInterval(this._healthCheckTimer);
      this._healthCheckTimer = undefined;
    }

    if (this._beforeExitHandler) {
      process.off('beforeExit', this._beforeExitHandler);
      this._beforeExitHandler = undefined;
    }

    if (!this._initialized) {
      this._cleaningUp = false;
      return;
    }

    this._initialized = false;
    this._stats.initialized = false;

    if (this.cleanupFn) {
      try {
        await this.cleanupFn();
      } finally {
        this._cleaningUp = false;
      }

      return;
    }

    this._cleaningUp = false;
  }

  /**
   * Run health check
   */
  async healthCheck(): Promise<ToolHealthCheckResult> {
    if (!this._initialized || this._cleaningUp) {
      return {
        healthy: false,
        error: 'Tool is not initialized',
      };
    }

    if (!this.healthCheckFn) {
      return {
        healthy: true,
        metadata: { message: 'No health check configured' },
      };
    }

    const lifecycleGeneration = this._lifecycleGeneration;

    try {
      const result = await this.healthCheckFn();
      if (
        !this._initialized ||
        this._cleaningUp ||
        this._lifecycleGeneration !== lifecycleGeneration
      ) {
        return {
          healthy: false,
          error: 'Tool is not initialized',
        };
      }
      this._stats.lastHealthCheck = result;
      this._stats.lastHealthCheckTime = Date.now();
      return result;
    } catch (error) {
      if (
        !this._initialized ||
        this._cleaningUp ||
        this._lifecycleGeneration !== lifecycleGeneration
      ) {
        return {
          healthy: false,
          error: 'Tool is not initialized',
        };
      }
      const result: ToolHealthCheckResult = {
        healthy: false,
        error: getErrorMessage(error),
      };
      this._stats.lastHealthCheck = result;
      this._stats.lastHealthCheckTime = Date.now();
      return result;
    }
  }

  /**
   * Get tool statistics
   */
  getStats(): ManagedToolStats {
    return { ...this._stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this._stats.totalExecutions = 0;
    this._stats.successfulExecutions = 0;
    this._stats.failedExecutions = 0;
    this._stats.lastExecutionTime = undefined;
  }

  /**
   * Convert to LangChain tool format
   */
  toLangChainTool(): {
    name: string;
    description: string;
    invoke: (input: TInput) => Promise<TOutput>;
  } {
    return {
      name: this.name,
      description: this.description,
      invoke: async (input: TInput) => {
        return await this.execute(input);
      },
    };
  }

  private async runPeriodicHealthCheck(): Promise<void> {
    if (!this.healthCheckFn || this._healthCheckInFlight || !this._initialized || this._cleaningUp) {
      return;
    }

    this._healthCheckInFlight = true;
    const lifecycleGeneration = this._lifecycleGeneration;

    try {
      const result = await this.healthCheckFn();
      if (
        !this._initialized ||
        this._cleaningUp ||
        this._lifecycleGeneration !== lifecycleGeneration
      ) {
        return;
      }
      this._stats.lastHealthCheck = result;
      this._stats.lastHealthCheckTime = Date.now();
    } catch (error) {
      if (
        !this._initialized ||
        this._cleaningUp ||
        this._lifecycleGeneration !== lifecycleGeneration
      ) {
        return;
      }
      this._stats.lastHealthCheck = {
        healthy: false,
        error: getErrorMessage(error),
      };
      this._stats.lastHealthCheckTime = Date.now();
    } finally {
      this._healthCheckInFlight = false;
    }
  }

  private ensureBeforeExitHandler(): void {
    if (!this.autoCleanup || this._beforeExitHandler) {
      return;
    }

    // Register auto-cleanup on process exit so instances can release resources.
    this._beforeExitHandler = () => {
      this.cleanup().catch(err =>
        logger.error('Cleanup failed', {
          toolName: this.name,
          error: getErrorMessage(err),
          ...(err instanceof Error && err.stack ? { stack: err.stack } : {})
        })
      );
    };
    process.on('beforeExit', this._beforeExitHandler);
  }
}

/**
 * Create a managed tool
 */
export function createManagedTool<TContext = undefined, TInput = unknown, TOutput = unknown>(
  config: ManagedToolConfig<TContext, TInput, TOutput>
): ManagedTool<TContext, TInput, TOutput> {
  return new ManagedTool(config);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
