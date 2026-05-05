import type { BaseMessage } from '@langchain/core/messages';

/**
 * Agent-like contract used by the test runner.
 */
export interface AgentTestAgent<TInput = unknown, TState = unknown> {
  invoke(input: TInput): TState | Promise<TState>;
}

/**
 * Captured runner step. The current runner preserves an empty step list, but
 * this contract gives future step capture a typed state boundary.
 */
export interface AgentTestRunnerStep<TState = unknown> {
  state: TState;
  messages: BaseMessage[];
  timestamp: number;
}

/**
 * Configuration for agent test runner
 */
export interface AgentTestConfig<TState = unknown> {
  /**
   * Maximum time to wait for agent response (ms)
   */
  timeout?: number;
  
  /**
   * Whether to capture intermediate steps
   */
  captureSteps?: boolean;
  
  /**
   * Whether to validate state after each step
   */
  validateState?: boolean;
  
  /**
   * Custom state validator
   */
  stateValidator?: (state: TState | undefined) => boolean | Promise<boolean>;
}

/**
 * Result from agent test run
 */
export interface AgentTestResult<TState = unknown, TStep = AgentTestRunnerStep<TState>> {
  /**
   * Final state after execution
   */
  finalState: TState | undefined;
  
  /**
   * Messages exchanged
   */
  messages: BaseMessage[];
  
  /**
   * Execution time in milliseconds
   */
  executionTime: number;
  
  /**
   * Intermediate steps (if captured)
   */
  steps?: TStep[];
  
  /**
   * Whether the test passed
   */
  passed: boolean;
  
  /**
   * Error if test failed
   */
  error?: Error;
}

/**
 * Agent test runner for integration testing
 * 
 * @example
 * ```typescript
 * const runner = new AgentTestRunner(agent, {
 *   timeout: 5000,
 *   captureSteps: true
 * });
 * 
 * const result = await runner.run({
 *   messages: [new HumanMessage('Hello')]
 * });
 * 
 * expect(result.passed).toBe(true);
 * expect(result.messages.length).toBeGreaterThan(1);
 * ```
 */
export class AgentTestRunner<
  TInput = unknown,
  TState = unknown,
  TStep = AgentTestRunnerStep<TState>,
> {
  constructor(
    private agent: AgentTestAgent<TInput, TState>,
    private config: AgentTestConfig<TState> = {}
  ) {}
  
  /**
   * Run the agent with given input
   */
  async run(input: TInput): Promise<AgentTestResult<TState, TStep>> {
    const startTime = Date.now();
    const steps: TStep[] = [];
    let finalState: TState | undefined;
    let messages: BaseMessage[] = [];
    let passed = true;
    let error: Error | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    
    try {
      // Set timeout if configured
      const timeout = this.config.timeout ?? 30000;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Agent test timeout')), timeout);
      });
      
      // Run agent
      const runPromise = (async () => {
        if (this.config.captureSteps) {
          // Capture intermediate steps
          const result = await this.agent.invoke(input);
          finalState = result;
          messages = extractMessages(result);
        } else {
          // Just run to completion
          const result = await this.agent.invoke(input);
          finalState = result;
          messages = extractMessages(result);
        }
        
        // Validate state if configured
        if (this.config.validateState && this.config.stateValidator) {
          const isValid = await this.config.stateValidator(finalState);
          if (!isValid) {
            throw new Error('State validation failed');
          }
        }
      })();
      
      try {
        await Promise.race([runPromise, timeoutPromise]);
      } finally {
        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }
      }
    } catch (err) {
      passed = false;
      error = err as Error;
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      finalState,
      messages,
      executionTime,
      steps: this.config.captureSteps ? steps : undefined,
      passed,
      error,
    };
  }
  
  /**
   * Run multiple test cases
   */
  async runMany(inputs: TInput[]): Promise<AgentTestResult<TState, TStep>[]> {
    return Promise.all(inputs.map((input) => this.run(input)));
  }
}

/**
 * Create an agent test runner
 */
export function createAgentTestRunner<
  TInput = unknown,
  TState = unknown,
  TStep = AgentTestRunnerStep<TState>,
>(
  agent: AgentTestAgent<TInput, TState>,
  config?: AgentTestConfig<TState>
): AgentTestRunner<TInput, TState, TStep> {
  return new AgentTestRunner(agent, config);
}

export function extractMessages(state: unknown): BaseMessage[] {
  if (typeof state !== 'object' || state === null) {
    return [];
  }

  const { messages } = state as { messages?: unknown };
  return Array.isArray(messages) ? (messages as BaseMessage[]) : [];
}
