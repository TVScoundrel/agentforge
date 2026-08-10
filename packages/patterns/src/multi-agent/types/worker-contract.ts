import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { RunnableConfig } from '@langchain/core/runnables';
import type { CompiledStateGraph } from '@langchain/langgraph';
import type { Tool } from '@agentforge/core';
import type { MultiAgentStateType } from '../state.js';
import type { WorkerCapabilities } from '../schemas.js';

export type WorkerExecutionConfig = RunnableConfig | Record<string, unknown>;
type WorkerTool = Tool<never, unknown>;

export interface WorkerConfig {
  id: string;
  capabilities: WorkerCapabilities;
  model?: BaseChatModel;
  tools?: WorkerTool[];
  systemPrompt?: string;
  verbose?: boolean;
  /**
   * Custom execution function. When provided, this takes precedence over
   * the `agent` property.
   */
  executeFn?: (state: MultiAgentStateType, config?: WorkerExecutionConfig) => Promise<Partial<MultiAgentStateType>>;
  /**
   * ReAct agent instance. `executeFn` takes precedence when both are set.
   */
  agent?: CompiledStateGraph<unknown, unknown>;
}
