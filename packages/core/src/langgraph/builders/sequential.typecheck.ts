import { Annotation } from '@langchain/langgraph';
import type { StateGraph } from '@langchain/langgraph';
import { createSequentialWorkflow } from './sequential.js';

type Assert<T extends true> = T;
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type ExtractGraphState<TGraph> =
  TGraph extends StateGraph<unknown, infer TState, unknown, string> ? TState : never;

const TestState = Annotation.Root({
  messages: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  count: Annotation<number>({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
});

const inferredWorkflow = createSequentialWorkflow(TestState, [
  {
    name: 'inferred',
    node: (state) => ({
      messages: [`count:${state.count}`],
    }),
  },
]);

const legacyWorkflow = createSequentialWorkflow<typeof TestState.State>(TestState, [
  {
    name: 'legacy',
    node: (state) => ({
      messages: [`legacy:${state.count}`],
    }),
  },
]);

type InferredStateMatchesSchema = Assert<
  IsEqual<ExtractGraphState<typeof inferredWorkflow>, typeof TestState.State>
>;
type LegacyStateMatchesSchema = Assert<
  IsEqual<ExtractGraphState<typeof legacyWorkflow>, typeof TestState.State>
>;
export type SequentialBuilderTypeChecks = [InferredStateMatchesSchema, LegacyStateMatchesSchema];

void inferredWorkflow;
void legacyWorkflow;
