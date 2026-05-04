import type { BaseMessage } from '@langchain/core/messages';
import type {
  AgentTestAgent,
  AgentTestConfig,
  AgentTestResult,
  AgentTestRunnerStep,
} from './agent-test-runner.js';

type ExampleInput = { messages: BaseMessage[]; userId: string };
type ExampleState = { messages: BaseMessage[]; score: number };
type ExampleStep = { name: string; state: ExampleState };

declare const agent: AgentTestAgent<ExampleInput, ExampleState>;
declare const config: AgentTestConfig<ExampleState>;
declare const result: AgentTestResult<ExampleState, ExampleStep>;
declare const step: AgentTestRunnerStep<ExampleState>;

async function acceptsTypedRunnerContracts(input: ExampleInput) {
  const state = await agent.invoke(input);
  const validationResult = await config.stateValidator?.(state);

  result.finalState?.score.toFixed();
  result.steps?.[0]?.state.score.toFixed();
  step.state.score.toFixed();

  return validationResult ?? true;
}

void acceptsTypedRunnerContracts;
