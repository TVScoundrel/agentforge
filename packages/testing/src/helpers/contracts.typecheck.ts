import type { BaseMessage } from '@langchain/core/messages';
import {
  createPlanningState,
  createReActState,
  createStateBuilder,
} from './state-builder.js';
import {
  assertHasKeys,
  assertStateHasFields,
  assertStateSnapshot,
  assertToolCalled,
} from './assertions.js';

type Assert<T extends true> = T;
type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends
    (<T>() => T extends TRight ? 1 : 2)
    ? true
    : false;

const builtState = createStateBuilder<{
  iteration: number;
  metadata: { source: string };
}>()
  .set('iteration', 1)
  .set('metadata', { source: 'spec' })
  .addHumanMessage('hello')
  .build();

const keyedState = {
  0: 'zero',
  one: 1,
};

const reactState = createReActState<{ query: string }, number>({
  toolCalls: [{ name: 'search', args: { query: 'docs' } }],
  toolResults: [{ name: 'search', result: 2 }],
});

const planningState = createPlanningState<{ search: { hits: number } }>({
  currentStep: 0,
  results: {
    search: { hits: 3 },
  },
});

const defaultPlanningState = createPlanningState<{ search: { hits: number } }>();
const unknownToolCallState = createReActState({
  toolCalls: [{ name: 'search', args: 'opaque' as unknown }],
});

assertStateHasFields(builtState, ['iteration', 'metadata']);
assertStateHasFields(keyedState, [0, 'one']);
assertStateSnapshot(planningState, { currentStep: 0 });
assertHasKeys(planningState, ['messages', 'plan', 'currentStep', 'results']);
assertToolCalled(reactState.toolCalls, 'search', { query: 'docs' });
assertToolCalled(unknownToolCallState.toolCalls, 'search');

type BuiltStateMessages = Assert<
  Equal<typeof builtState.messages, BaseMessage[] | undefined>
>;
type ReactToolArgs = Assert<
  Equal<(typeof reactState.toolCalls)[number]['args'], { query: string }>
>;
type PlanningResults = Assert<
  Equal<typeof planningState.results, Partial<{ search: { hits: number } }>>
>;
type DefaultPlanningResults = Assert<
  Equal<typeof defaultPlanningState.results, Partial<{ search: { hits: number } }>>
>;

export type TestingHelperTypeChecks = [
  BuiltStateMessages,
  ReactToolArgs,
  PlanningResults,
  DefaultPlanningResults,
];

void builtState;
void reactState;
void planningState;
void defaultPlanningState;
void unknownToolCallState;
