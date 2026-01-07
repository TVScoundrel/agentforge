import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

/**
 * Builder for creating test states
 */
export class StateBuilder<T extends Record<string, any> = Record<string, any>> {
  private state: Partial<T> = {};
  
  /**
   * Set a field in the state
   */
  set<K extends keyof T>(key: K, value: T[K]): this {
    this.state[key] = value;
    return this;
  }
  
  /**
   * Set multiple fields in the state
   */
  setMany(fields: Partial<T>): this {
    Object.assign(this.state, fields);
    return this;
  }
  
  /**
   * Add a message to the messages array
   */
  addMessage(message: BaseMessage): this {
    if (!(this.state as any).messages) {
      (this.state as any).messages = [];
    }
    ((this.state as any).messages as BaseMessage[]).push(message);
    return this;
  }
  
  /**
   * Add multiple messages
   */
  addMessages(messages: BaseMessage[]): this {
    messages.forEach((msg) => this.addMessage(msg));
    return this;
  }
  
  /**
   * Add a human message
   */
  addHumanMessage(content: string): this {
    return this.addMessage(new HumanMessage(content));
  }
  
  /**
   * Add an AI message
   */
  addAIMessage(content: string): this {
    return this.addMessage(new AIMessage(content));
  }
  
  /**
   * Add a system message
   */
  addSystemMessage(content: string): this {
    return this.addMessage(new SystemMessage(content));
  }
  
  /**
   * Build the state
   */
  build(): T {
    return this.state as T;
  }
  
  /**
   * Reset the builder
   */
  reset(): this {
    this.state = {};
    return this;
  }
}

/**
 * Create a state builder
 */
export function createStateBuilder<T extends Record<string, any> = Record<string, any>>(): StateBuilder<T> {
  return new StateBuilder<T>();
}

/**
 * Create a simple conversation state
 */
export function createConversationState(messages: string[]): { messages: BaseMessage[] } {
  const builder = createStateBuilder<{ messages: BaseMessage[] }>();
  
  messages.forEach((msg, index) => {
    if (index % 2 === 0) {
      builder.addHumanMessage(msg);
    } else {
      builder.addAIMessage(msg);
    }
  });
  
  return builder.build();
}

/**
 * Create a ReAct agent state
 */
export function createReActState(config: {
  messages?: BaseMessage[];
  thoughts?: string[];
  toolCalls?: Array<{ name: string; args: any }>;
  toolResults?: Array<{ name: string; result: string }>;
  scratchpad?: string[];
  iterations?: number;
  maxIterations?: number;
} = {}): any {
  return {
    messages: config.messages || [],
    thoughts: config.thoughts || [],
    toolCalls: config.toolCalls || [],
    toolResults: config.toolResults || [],
    scratchpad: config.scratchpad || [],
    iterations: config.iterations || 0,
    maxIterations: config.maxIterations || 10,
  };
}

/**
 * Create a planning agent state
 */
export function createPlanningState(config: {
  messages?: BaseMessage[];
  plan?: Array<{ step: string; status: string }>;
  currentStep?: number;
  results?: Record<string, any>;
} = {}): any {
  return {
    messages: config.messages || [],
    plan: config.plan || [],
    currentStep: config.currentStep || 0,
    results: config.results || {},
  };
}

