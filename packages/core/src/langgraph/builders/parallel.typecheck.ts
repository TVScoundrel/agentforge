import { Annotation } from '@langchain/langgraph';
import type { StateGraph } from '@langchain/langgraph';
import { createParallelWorkflow } from './parallel.js';

type Assert<T extends true> = T;
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type ExtractGraphState<TGraph> =
  TGraph extends StateGraph<unknown, infer TState, unknown, string> ? TState : never;
type ExtractGraphUpdate<TGraph> =
  TGraph extends StateGraph<unknown, unknown, infer TUpdate, string> ? TUpdate : never;

const TestState = Annotation.Root({
  results: Annotation<string[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  count: Annotation<number>({
    reducer: (left, right) => left + right,
    default: () => 0,
  }),
});

const inferredWorkflow = createParallelWorkflow(TestState, {
  parallel: [
    {
      name: 'inferred',
      node: (state) => ({
        results: [`count:${state.count}`],
      }),
    },
  ],
  aggregate: {
    name: 'aggregate',
    node: async (state) => ({ results: [`total:${state.results.length}`] }),
  },
});

const UpdateState = Annotation.Root({
  values: Annotation<number[], number>({
    reducer: (left, right) => [...left, right],
    default: () => [],
  }),
});

const updateWorkflow = createParallelWorkflow(UpdateState, {
  parallel: [{ name: 'valid-update', node: (state) => ({ values: state.values.length }) }],
});

createParallelWorkflow(UpdateState, {
  parallel: [
    {
      name: 'invalid-update',
      // @ts-expect-error Parallel node updates must use the schema-derived field types.
      node: () => ({ values: 'not-a-number' }),
    },
  ],
});

type InferredStateMatchesSchema = Assert<
  IsEqual<ExtractGraphState<typeof inferredWorkflow>, typeof TestState.State>
>;
type InferredUpdateMatchesSchema = Assert<
  ExtractGraphUpdate<typeof updateWorkflow> extends typeof UpdateState.Update ? true : false
>;
export type ParallelBuilderTypeChecks = [InferredStateMatchesSchema, InferredUpdateMatchesSchema];

void inferredWorkflow;
void updateWorkflow;
