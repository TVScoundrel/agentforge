import { BaseMessage } from '@langchain/core/messages';

/**
 * Configuration for agent test runner
 */
export interface AgentTestConfig {
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
  stateValidator?: (state: any) => boolean | Promise<boolean>;
}

/**
 * Result from agent test run
 */
export interface AgentTestResult {
  /**
   * Final state after execution
   */
  finalState: any;
  
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
  steps?: any[];
  
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
export class AgentTestRunner {
  constructor(
    private agent: any,
    private config: AgentTestConfig = {}
  ) {}
  
  /**
   * Run the agent with given input
   */
  async run(input: any): Promise<AgentTestResult> {
    const startTime = Date.now();
    const steps: any[] = [];
    let finalState: any;
    let messages: BaseMessage[] = [];
    let passed = true;
    let error: Error | undefined;
    
    try {
      // Set timeout if configured
      const timeout = this.config.timeout || 30000;
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Agent test timeout')), timeout);
      });
      
      // Run agent
      const runPromise = (async () => {
        if (this.config.captureSteps) {
          // Capture intermediate steps
          const result = await this.agent.invoke(input);
          finalState = result;
          messages = result.messages || [];
        } else {
          // Just run to completion
          const result = await this.agent.invoke(input);
          finalState = result;
          messages = result.messages || [];
        }
        
        // Validate state if configured
        if (this.config.validateState && this.config.stateValidator) {
          const isValid = await this.config.stateValidator(finalState);
          if (!isValid) {
            throw new Error('State validation failed');
          }
        }
      })();
      
      await Promise.race([runPromise, timeoutPromise]);
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
  async runMany(inputs: any[]): Promise<AgentTestResult[]> {
    return Promise.all(inputs.map((input) => this.run(input)));
  }
}

/**
 * Create an agent test runner
 */
export function createAgentTestRunner(
  agent: any,
  config?: AgentTestConfig
): AgentTestRunner {
  return new AgentTestRunner(agent, config);
}

