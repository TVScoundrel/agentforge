import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { MultiAgentStateType } from '../state.js';
import type { RoutingDecision, RoutingStrategy } from '../schemas.js';

export interface SupervisorConfig {
  model?: BaseChatModel;
  strategy: RoutingStrategy;
  systemPrompt?: string;
  routingFn?: (state: MultiAgentStateType) => Promise<RoutingDecision>;
  verbose?: boolean;
  maxIterations?: number;
  maxToolRetries?: number;
}
