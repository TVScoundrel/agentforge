import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { BaseCheckpointSaver } from '@langchain/langgraph';
import type { MultiAgentStateType } from '../state.js';
import type { SupervisorConfig } from './supervisor-contract.js';
import type { WorkerConfig } from './worker-contract.js';

export interface AggregatorConfig {
  model?: BaseChatModel;
  systemPrompt?: string;
  aggregateFn?: (state: MultiAgentStateType) => Promise<string>;
  verbose?: boolean;
}

export interface MultiAgentSystemConfig {
  supervisor: SupervisorConfig;
  workers: WorkerConfig[];
  aggregator?: AggregatorConfig;
  maxIterations?: number;
  verbose?: boolean;
  checkpointer?: BaseCheckpointSaver;
}
