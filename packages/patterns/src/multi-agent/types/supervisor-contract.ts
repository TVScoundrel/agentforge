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
  /**
   * Maximum number of tool call retries before requiring a routing decision.
   * Prevents infinite loops where the supervisor keeps calling tools without
   * making a routing decision.
   * @default 3
   */
  maxToolRetries?: number;
}
