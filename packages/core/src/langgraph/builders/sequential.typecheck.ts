import { Annotation } from '@langchain/langgraph';
import type { StateGraph } from '@langchain/langgraph';
import { createSequentialWorkflow, sequentialBuilder } from './sequential.js';

type Assert<T extends true> = T;
type IsEqual<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
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
  .addNode('inferred', (state) => ({
    messages: [`count:${state.count}`],
  }))
  .build();

const UpdateState = Annotation.Root({
  values: Annotation<number[], number>({
    reducer: (left, right) => [...left, right],
    default: () => [],
  }),
});

const sequentialUpdateWorkflow = createSequentialWorkflow(UpdateState, [
  { name: 'valid-update', node: (state) => ({ values: state.values.length }) },
]);
const builderUpdateWorkflow = sequentialBuilder(UpdateState)
  .addNode('valid-update', (state) => ({ values: state.values.length }))
  .build();

createSequentialWorkflow(UpdateState, [
  {
    name: 'invalid-update',
    // @ts-expect-error Node updates must use the schema-derived field types.
    node: () => ({ values: 'not-a-number' }),
  },
]);

sequentialBuilder(UpdateState)
  // @ts-expect-error Fluent node updates must use the schema-derived field types.
  .addNode('invalid-update', () => ({ values: 'not-a-number' }))
  .build();

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
type FluentStateMatchesSchema = Assert<
  IsEqual<ExtractGraphState<typeof inferredBuilderWorkflow>, typeof TestState.State>
>;
type FluentUpdateMatchesSchema = Assert<
  ExtractGraphUpdate<typeof builderUpdateWorkflow> extends typeof UpdateState.Update ? true : false
>;
type SequentialUpdateMatchesSchema = Assert<
  ExtractGraphUpdate<typeof sequentialUpdateWorkflow> extends typeof UpdateState.Update
    ? true
    : false
>;
export type SequentialBuilderTypeChecks = [
  InferredStateMatchesSchema,
  FluentStateMatchesSchema,
  FluentUpdateMatchesSchema,
  SequentialUpdateMatchesSchema,
];

void inferredWorkflow;
void inferredBuilderWorkflow;
void sequentialUpdateWorkflow;
void builderUpdateWorkflow;
