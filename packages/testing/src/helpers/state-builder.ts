import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

type StateBuilderFields = Record<string, unknown> & { messages?: BaseMessage[] };
type MessageState = { messages: BaseMessage[] };
type BuiltState<TState extends StateBuilderFields> = TState & Partial<MessageState>;

export interface TestToolCall<TArgs = unknown> {
  name: string;
  args: TArgs;
}

export interface TestToolResult<TResult = string> {
  name: string;
  result: TResult;
}

export interface ReActTestState<TArgs = unknown, TResult = string> {
  messages: BaseMessage[];
  thoughts: string[];
  toolCalls: Array<TestToolCall<TArgs>>;
  toolResults: Array<TestToolResult<TResult>>;
  scratchpad: string[];
  iterations: number;
  maxIterations: number;
}

export interface PlanningStep<TStatus extends string = string> {
  step: string;
  status: TStatus;
}

export interface PlanningTestState<
  TResultMap extends Record<string, unknown> = Record<string, unknown>,
  TStatus extends string = string,
> extends StateBuilderFields {
  messages: BaseMessage[];
  plan: Array<PlanningStep<TStatus>>;
  currentStep: number;
  results: TResultMap;
}

/**
 * Builder for creating test states
 */
export class StateBuilder<TState extends StateBuilderFields = StateBuilderFields> {
  private state: Partial<TState> & Partial<MessageState> = {};

  /**
   * Set a field in the state
   */
  set<K extends keyof TState>(key: K, value: TState[K]): this {
    this.state[key] = value;
    return this;
  }

  /**
   * Set multiple fields in the state
   */
  setMany(fields: Partial<TState>): this {
    Object.assign(this.state, fields);
    return this;
  }

  private ensureMessages(): BaseMessage[] {
    if (!this.state.messages) {
      const messages: BaseMessage[] = [];
      this.state.messages = messages;
    }

    return this.state.messages;
  }

  /**
   * Add a message to the messages array
   */
  addMessage(message: BaseMessage): this {
    this.ensureMessages().push(message);
    return this;
  }

  /**
   * Add multiple messages
   */
  addMessages(messages: ReadonlyArray<BaseMessage>): this {
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
  build(): BuiltState<TState> {
    return this.state as BuiltState<TState>;
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
export function createStateBuilder<TState extends StateBuilderFields = StateBuilderFields>(): StateBuilder<TState> {
  return new StateBuilder<TState>();
}

/**
 * Create a simple conversation state
 */
export function createConversationState(messages: ReadonlyArray<string>): MessageState {
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
export function createReActState<TArgs = unknown, TResult = string>(
  config: Partial<ReActTestState<TArgs, TResult>> = {},
): ReActTestState<TArgs, TResult> {
  return {
    messages: config.messages ?? [],
    thoughts: config.thoughts ?? [],
    toolCalls: config.toolCalls ?? [],
    toolResults: config.toolResults ?? [],
    scratchpad: config.scratchpad ?? [],
    iterations: config.iterations ?? 0,
    maxIterations: config.maxIterations ?? 10,
  };
}

/**
 * Create a planning agent state
 */
export function createPlanningState<
  TResultMap extends Record<string, unknown> = Record<string, unknown>,
  TStatus extends string = string,
>(
  config: Partial<PlanningTestState<TResultMap, TStatus>> = {},
): PlanningTestState<TResultMap, TStatus> {
  return {
    messages: config.messages ?? [],
    plan: config.plan ?? [],
    currentStep: config.currentStep ?? 0,
    results: config.results ?? ({} as TResultMap),
  };
}
