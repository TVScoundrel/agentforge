/**
 * Tool Lifecycle Management - Manage tool initialization, cleanup, and resources
 * @module tools/lifecycle
 */

import { createLogger, LogLevel } from '../langgraph/observability/logger.js';

const logger = createLogger('agentforge:core:tools:lifecycle', { level: LogLevel.INFO });

export interface ToolHealthCheckResult {
  healthy: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ManagedToolConfig<TContext = any, TInput = any, TOutput = any> {
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
  context?: TContext;
  autoCleanup?: boolean;
  healthCheckInterval?: number;
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
export class ManagedTool<TContext = any, TInput = any, TOutput = any> {
  public readonly name: string;
  public readonly description: string;
  private readonly initializeFn?: () => Promise<void>;
  private readonly executeFn: (input: TInput) => Promise<TOutput>;
  private readonly cleanupFn?: () => Promise<void>;
  private readonly healthCheckFn?: () => Promise<ToolHealthCheckResult>;
  private readonly autoCleanup: boolean;
  private readonly healthCheckInterval?: number;

  private _initialized = false;
  private _context: TContext;
  private _stats: ManagedToolStats = {
    initialized: false,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
  };
  private _healthCheckTimer?: NodeJS.Timeout;

  constructor(config: ManagedToolConfig<TContext, TInput, TOutput>) {
    this.name = config.name;
    this.description = config.description;
    this.initializeFn = config.initialize?.bind(this);
    this.executeFn = config.execute.bind(this);
    this.cleanupFn = config.cleanup?.bind(this);
    this.healthCheckFn = config.healthCheck?.bind(this);
    this.autoCleanup = config.autoCleanup ?? true;
    this.healthCheckInterval = config.healthCheckInterval;
    this._context = config.context as TContext;

    // Setup auto-cleanup on process exit
    if (this.autoCleanup) {
      process.on('beforeExit', () => {
        this.cleanup().catch(err =>
          logger.error('Cleanup failed', {
            toolName: this.name,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
          })
        );
      });
    }
  }

  /**
   * Get the tool context (e.g., connection pool, API client)
   */
  get context(): TContext {
    return this._context;
  }

  /**
   * Set the tool context
   */
  set context(value: TContext) {
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
    if (this._initialized) {
      return;
    }

    if (this.initializeFn) {
      await this.initializeFn();
    }

    this._initialized = true;
    this._stats.initialized = true;

    // Start periodic health checks if configured
    if (this.healthCheckInterval && this.healthCheckFn) {
      this._healthCheckTimer = setInterval(async () => {
        try {
          const result = await this.healthCheckFn!();
          this._stats.lastHealthCheck = result;
          this._stats.lastHealthCheckTime = Date.now();
        } catch (error) {
          this._stats.lastHealthCheck = {
            healthy: false,
            error: (error as Error).message,
          };
          this._stats.lastHealthCheckTime = Date.now();
        }
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
    if (!this._initialized) {
      return;
    }

    // Stop health check timer
    if (this._healthCheckTimer) {
      clearInterval(this._healthCheckTimer);
      this._healthCheckTimer = undefined;
    }

    if (this.cleanupFn) {
      await this.cleanupFn();
    }

    this._initialized = false;
    this._stats.initialized = false;
  }

  /**
   * Run health check
   */
  async healthCheck(): Promise<ToolHealthCheckResult> {
    if (!this._initialized) {
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

    try {
      const result = await this.healthCheckFn();
      this._stats.lastHealthCheck = result;
      this._stats.lastHealthCheckTime = Date.now();
      return result;
    } catch (error) {
      const result: ToolHealthCheckResult = {
        healthy: false,
        error: (error as Error).message,
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
  toLangChainTool() {
    return {
      name: this.name,
      description: this.description,
      invoke: async (input: TInput) => {
        return await this.execute(input);
      },
    };
  }
}

/**
 * Create a managed tool
 */
export function createManagedTool<TContext = any, TInput = any, TOutput = any>(
  config: ManagedToolConfig<TContext, TInput, TOutput>
): ManagedTool<TContext, TInput, TOutput> {
  return new ManagedTool(config);
}

