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
  /**
   * Optional checkpointer for state persistence and human-in-the-loop flows.
   * Worker agents use isolated namespaces in the form
   * `{parent_thread_id}:worker:{workerId}` so nested interrupts can resume
   * without looping through the parent graph.
   */
  checkpointer?: BaseCheckpointSaver;
}
