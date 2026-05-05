import type { BaseMessage } from '@langchain/core/messages';
import type { AgentTestAgent } from './agent-test-runner.js';
import { createConversationSimulator } from './conversation-simulator.js';

type ExampleState = {
  messages: BaseMessage[];
  score: number;
};

declare const agent: AgentTestAgent<{ messages: BaseMessage[] }, ExampleState>;

export async function acceptsTypedConversationSimulator() {
  const simulator = createConversationSimulator<ExampleState>(agent);
  const result = await simulator.simulate(['hello']);

  return result.messages[0]?.content;
}
