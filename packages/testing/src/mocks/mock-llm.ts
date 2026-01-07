import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import { ChatResult } from '@langchain/core/outputs';
import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';

/**
 * Configuration for MockLLM
 */
export interface MockLLMConfig {
  /**
   * Predefined responses to return
   */
  responses?: string[];
  
  /**
   * Response generator function
   */
  responseGenerator?: (messages: BaseMessage[]) => string;
  
  /**
   * Delay in milliseconds before responding
   */
  delay?: number;
  
  /**
   * Whether to throw an error
   */
  shouldError?: boolean;
  
  /**
   * Error message to throw
   */
  errorMessage?: string;
  
  /**
   * Model name to report
   */
  modelName?: string;
}

/**
 * Mock LLM for testing
 * 
 * @example
 * ```typescript
 * const llm = createMockLLM({
 *   responses: ['Hello!', 'How can I help?']
 * });
 * 
 * const result = await llm.invoke([new HumanMessage('Hi')]);
 * console.log(result.content); // 'Hello!'
 * ```
 */
export class MockLLM extends BaseChatModel {
  private responses: string[];
  private responseGenerator?: (messages: BaseMessage[]) => string;
  private delay: number;
  private shouldError: boolean;
  private errorMessage: string;
  private callCount = 0;
  
  _llmType(): string {
    return 'mock';
  }
  
  constructor(config: MockLLMConfig = {}) {
    super({});

    this.responses = config.responses || ['Mock response'];
    this.responseGenerator = config.responseGenerator;
    this.delay = config.delay || 0;
    this.shouldError = config.shouldError || false;
    this.errorMessage = config.errorMessage || 'Mock LLM error';
  }
  
  async _generate(
    messages: BaseMessage[],
    options?: this['ParsedCallOptions'],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    if (this.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.delay));
    }
    
    if (this.shouldError) {
      throw new Error(this.errorMessage);
    }
    
    let content: string;
    
    if (this.responseGenerator) {
      content = this.responseGenerator(messages);
    } else {
      const index = this.callCount % this.responses.length;
      content = this.responses[index];
    }
    
    this.callCount++;
    
    const message = new AIMessage(content);
    
    return {
      generations: [{ text: content, message }],
      llmOutput: {},
    };
  }
  
  /**
   * Get the number of times the LLM has been called
   */
  getCallCount(): number {
    return this.callCount;
  }
  
  /**
   * Reset the call count
   */
  resetCallCount(): void {
    this.callCount = 0;
  }
}

/**
 * Create a mock LLM for testing
 */
export function createMockLLM(config?: MockLLMConfig): MockLLM {
  return new MockLLM(config);
}

/**
 * Create a mock LLM that echoes the last message
 */
export function createEchoLLM(): MockLLM {
  return new MockLLM({
    responseGenerator: (messages) => {
      const lastMessage = messages[messages.length - 1];
      return `Echo: ${lastMessage.content}`;
    },
  });
}

/**
 * Create a mock LLM that always errors
 */
export function createErrorLLM(errorMessage = 'Mock error'): MockLLM {
  return new MockLLM({
    shouldError: true,
    errorMessage,
  });
}

