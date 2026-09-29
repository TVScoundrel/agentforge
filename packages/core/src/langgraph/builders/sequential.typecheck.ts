import { Annotation } from '@langchain/langgraph';
import type { StateGraph } from '@langchain/langgraph';
import { createParallelWorkflow } from './parallel.js';
import { createSequentialWorkflow } from './sequential.js';
import { sequentialBuilder } from './sequential.js';

type Assert<T extends true> = T;
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type ExtractGraphState<TGraph> =
  TGraph extends StateGraph<unknown, infer TState, unknown, string> ? TState : never;
type ExtractGraphUpdate<TGraph> =
  TGraph extends StateGraph<unknown, unknown, infer TUpdate, string> ? TUpdate : never;

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

const inferredBuilderWorkflow = sequentialBuilder(TestState)
  .addNode('inferred', (state) => ({ messages: [`count:${state.count}`] }))
  .build();

const inferredParallelWorkflow = createParallelWorkflow(TestState, {
  parallel: [
    {
      name: 'inferred',
      node: (state) => ({ messages: [`count:${state.count}`] }),
    },
  ],
});

const UpdateState = Annotation.Root({
  values: Annotation<number[], number>({
    reducer: (left, right) => [...left, right],
    default: () => [],
  }),
});

const sequentialUpdateWorkflow = createSequentialWorkflow(UpdateState, [
  { name: 'valid', node: (state) => ({ values: state.values.length }) },
]);
const builderUpdateWorkflow = sequentialBuilder(UpdateState)
  .addNode('valid', (state) => ({ values: state.values.length }))
  .build();
const parallelUpdateWorkflow = createParallelWorkflow(UpdateState, {
  parallel: [{ name: 'valid', node: (state) => ({ values: state.values.length }) }],
});

createSequentialWorkflow(UpdateState, [
  // @ts-expect-error Node updates derive from the schema's numeric update type.
  { name: 'invalid', node: () => ({ values: 'invalid' }) },
]);
sequentialBuilder(UpdateState)
  // @ts-expect-error Fluent-builder updates derive from the schema's numeric update type.
  .addNode('invalid', () => ({ values: 'invalid' }));
createParallelWorkflow(UpdateState, {
  parallel: [
    // @ts-expect-error Parallel updates derive from the schema's numeric update type.
    { name: 'invalid', node: () => ({ values: 'invalid' }) },
  ],
});

// Legacy explicit state generics are no longer supported. State now derives from the schema.
// @ts-expect-error Explicit state generics should be rejected in favor of schema-derived inference.
createSequentialWorkflow<typeof TestState.State>(TestState, [
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
type BuilderStateMatchesSchema = Assert<
  IsEqual<ExtractGraphState<typeof inferredBuilderWorkflow>, typeof TestState.State>
>;
type ParallelStateMatchesSchema = Assert<
  IsEqual<ExtractGraphState<typeof inferredParallelWorkflow>, typeof TestState.State>
>;
type SequentialUpdateMatchesSchema = Assert<
  ExtractGraphUpdate<typeof sequentialUpdateWorkflow> extends typeof UpdateState.Update
    ? true
    : false
>;
type BuilderUpdateMatchesSchema = Assert<
  ExtractGraphUpdate<typeof builderUpdateWorkflow> extends typeof UpdateState.Update ? true : false
>;
type ParallelUpdateMatchesSchema = Assert<
  ExtractGraphUpdate<typeof parallelUpdateWorkflow> extends typeof UpdateState.Update ? true : false
>;
export type SequentialBuilderTypeChecks = [
  InferredStateMatchesSchema,
  BuilderStateMatchesSchema,
  ParallelStateMatchesSchema,
  SequentialUpdateMatchesSchema,
  BuilderUpdateMatchesSchema,
  ParallelUpdateMatchesSchema,
];

void inferredWorkflow;
void inferredBuilderWorkflow;
void inferredParallelWorkflow;
void sequentialUpdateWorkflow;
void builderUpdateWorkflow;
void parallelUpdateWorkflow;
