import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ToolCategory, toolBuilder } from '@agentforge/core';
import { z } from 'zod';
import { createPlanExecuteAgent } from './agent.js';
import type { ExecutorConfig, PlanExecuteAgentConfig } from './types.js';

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends
    (<T>() => T extends TRight ? 1 : 2)
    ? true
    : false;
type Expect<T extends true> = T;

const searchTool = toolBuilder()
  .name('search-tool')
  .description('Search for documents')
  .category(ToolCategory.WEB)
  .schema(z.object({ query: z.string().describe('Search query to execute') }))
  .implement(async ({ query }) => `result:${query}`)
  .build();

const executorConfig = {
  tools: [searchTool],
} satisfies ExecutorConfig<typeof searchTool>;

const preservesConcreteTool: Expect<
  Equal<(typeof executorConfig.tools)[number], typeof searchTool>
> = true;
void preservesConcreteTool;

declare const model: BaseChatModel;

const agentConfig = {
  planner: { model },
  executor: executorConfig,
} satisfies PlanExecuteAgentConfig<typeof searchTool>;

createPlanExecuteAgent(agentConfig);
