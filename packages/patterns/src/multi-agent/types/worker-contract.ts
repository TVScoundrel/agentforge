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
  executeFn?: (state: MultiAgentStateType, config?: WorkerExecutionConfig) => Promise<Partial<MultiAgentStateType>>;
  agent?: CompiledStateGraph<unknown, unknown>;
}
