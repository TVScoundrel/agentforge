import { createLogger, LogLevel } from '../langgraph/observability/logger.js';
import { runManagedHealthCheck, runPeriodicManagedHealthCheck } from './lifecycle-health.js';
import { ensureManagedBeforeExitHandler, performManagedCleanup, performManagedInitialize } from './lifecycle-hooks.js';
import type { ManagedToolState } from './lifecycle-internal-types.js';
import type { ManagedToolConfig, ManagedToolStats, ToolHealthCheckResult } from './lifecycle-types.js';

const logger = createLogger('agentforge:core:tools:lifecycle', { level: LogLevel.INFO });

export class ManagedTool<TContext = undefined, TInput = unknown, TOutput = unknown> {
  public readonly name: string;
  public readonly description: string;
  private readonly initializeFn?: () => Promise<void>;
  private readonly executeFn: (input: TInput) => Promise<TOutput>;
  private readonly cleanupFn?: () => Promise<void>;
  private readonly healthCheckFn?: () => Promise<ToolHealthCheckResult>;
  private readonly autoCleanup: boolean;
  private readonly healthCheckInterval?: number;
  private readonly state: ManagedToolState<TContext>;

  constructor(config: ManagedToolConfig<TContext, TInput, TOutput>) {
    this.name = config.name;
    this.description = config.description;
    this.initializeFn = config.initialize?.bind(this);
    this.executeFn = config.execute.bind(this);
    this.cleanupFn = config.cleanup?.bind(this);
    this.healthCheckFn = config.healthCheck?.bind(this);
    this.autoCleanup = config.autoCleanup ?? true;
    this.healthCheckInterval = config.healthCheckInterval;
    this.state = {
      initialized: false,
      context: config.context,
      stats: {
        initialized: false,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
      },
      healthCheckInFlight: false,
      cleaningUp: false,
      lifecycleGeneration: 0,
    };

    this.ensureBeforeExitHandler();
  }

  get context(): TContext | undefined {
    return this.state.context;
  }

  set context(value: TContext | undefined) {
    this.state.context = value;
  }

  get initialized(): boolean {
    return this.state.initialized;
  }

  async initialize(): Promise<void> {
    if (this.state.initializePromise) {
      await this.state.initializePromise;
      return;
    }

    if (this.state.cleanupPromise) {
      await this.state.cleanupPromise;

      if (this.state.initializePromise) {
        await this.state.initializePromise;
        return;
      }
    }

    if (this.state.initialized) {
      return;
    }

    const initializePromise = performManagedInitialize({
      autoCleanup: this.autoCleanup,
      ensureBeforeExitHandler: () => this.ensureBeforeExitHandler(),
      healthCheckFn: this.healthCheckFn,
      healthCheckInterval: this.healthCheckInterval,
      initializeFn: this.initializeFn,
      name: this.name,
      runPeriodicHealthCheck: () => this.runPeriodicHealthCheck(),
      state: this.state,
    });
    this.state.initializePromise = initializePromise;

    try {
      await initializePromise;
    } finally {
      this.state.initializePromise = undefined;
    }
  }

  async execute(input: TInput): Promise<TOutput> {
    if (!this.state.initialized) {
      throw new Error(`Tool ${this.name} is not initialized. Call initialize() first.`);
    }

    const startTime = Date.now();
    this.state.stats.totalExecutions++;

    try {
      const result = await this.executeFn(input);
      this.state.stats.successfulExecutions++;
      this.state.stats.lastExecutionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      this.state.stats.failedExecutions++;
      this.state.stats.lastExecutionTime = Date.now() - startTime;
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this.state.cleanupPromise) {
      await this.state.cleanupPromise;
      return;
    }

    if (this.state.initializePromise) {
      try {
        await this.state.initializePromise;
      } catch {
        // Cleanup should still settle lifecycle hooks if initialization fails.
      }
    }

    const cleanupPromise = performManagedCleanup({
      cleanupFn: this.cleanupFn,
      state: this.state,
    });
    this.state.cleanupPromise = cleanupPromise;

    try {
      await cleanupPromise;
    } finally {
      this.state.cleanupPromise = undefined;
    }
  }

  async healthCheck(): Promise<ToolHealthCheckResult> {
    return runManagedHealthCheck(this.state, this.healthCheckFn);
  }

  getStats(): ManagedToolStats {
    return { ...this.state.stats };
  }

  resetStats(): void {
    this.state.stats.totalExecutions = 0;
    this.state.stats.successfulExecutions = 0;
    this.state.stats.failedExecutions = 0;
    this.state.stats.lastExecutionTime = undefined;
  }

  toLangChainTool(): { name: string; description: string; invoke: (input: TInput) => Promise<TOutput> } {
    return {
      name: this.name,
      description: this.description,
      invoke: async (input: TInput) => this.execute(input),
    };
  }

  private async runPeriodicHealthCheck(): Promise<void> {
    await runPeriodicManagedHealthCheck(this.state, this.healthCheckFn);
  }

  private ensureBeforeExitHandler(): void {
    ensureManagedBeforeExitHandler({
      autoCleanup: this.autoCleanup,
      cleanup: () => this.cleanup(),
      logger,
      name: this.name,
      state: this.state,
    });
  }
}

export function createManagedTool<TContext = undefined, TInput = unknown, TOutput = unknown>(
  config: ManagedToolConfig<TContext, TInput, TOutput>
): ManagedTool<TContext, TInput, TOutput> {
  return new ManagedTool(config);
}
