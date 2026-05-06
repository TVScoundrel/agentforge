import type { CompiledStateGraph, BaseCheckpointSaver } from '@langchain/langgraph';
import type { Tool, ToolRegistry } from '@agentforge/core';
import { ReActAgentBuilder } from '../../src/react/builder.js';
import { createReActAgent } from '../../src/react/agent.js';
import { formatToolsForPrompt } from '../../src/react/prompts.js';
import type { ReActStateType } from '../../src/react/state.js';
import type { ReActToolInput } from '../../src/react/types.js';
import { z, type ZodSchema } from 'zod';

type Equal<Left, Right> =
  (<T>() => T extends Left ? 1 : 2) extends
  (<T>() => T extends Right ? 1 : 2) ? true : false;
type AssertTrue<T extends true> = T;
type GraphState<T> = T extends CompiledStateGraph<infer TState, infer _TUpdate> ? TState : never;
type GraphUpdate<T> = T extends CompiledStateGraph<infer _TState, infer TUpdate> ? TUpdate : never;

type BuilderCheckpointerArg = Parameters<ReActAgentBuilder['withCheckpointer']>[0];
type BuilderToolsArg = Parameters<ReActAgentBuilder['withTools']>[0];
type BuilderToolArrayArg = Exclude<BuilderToolsArg, ToolRegistry>;
type PromptToolDescriptor = Parameters<typeof formatToolsForPrompt>[0][number];

type _reactAgentStateMatchesReActState = AssertTrue<
  Equal<GraphState<ReturnType<typeof createReActAgent>>, ReActStateType>
>;
type _reactAgentUpdateIsUnknown = AssertTrue<
  Equal<GraphUpdate<ReturnType<typeof createReActAgent>>, unknown>
>;
type _builderCheckpointerMatchesContract = AssertTrue<
  Equal<BuilderCheckpointerArg, BaseCheckpointSaver | true>
>;
type _builderToolsArrayIsPublicToolInputArray = AssertTrue<
  Equal<BuilderToolArrayArg, ReActToolInput[]>
>;
type _promptToolDescriptorSchemaMatchesContract = AssertTrue<
  Equal<PromptToolDescriptor['schema'], ZodSchema<unknown>>
>;

declare const typedTool: Tool<{ input: string }, { ok: boolean }>;
const validToolArray: BuilderToolArrayArg = [typedTool];
new ReActAgentBuilder().withTools(validToolArray);

// @ts-expect-error invalid checkpointer values should be rejected by the builder contract
new ReActAgentBuilder().withCheckpointer('invalid-checkpointer');

// @ts-expect-error prompt tool descriptors should reject non-schema primitive values
formatToolsForPrompt([{ name: 'bad-tool', description: 'desc', schema: 123 }]);

formatToolsForPrompt([
  { name: 'good-tool', description: 'desc', schema: z.object({ input: z.string() }) },
]);
