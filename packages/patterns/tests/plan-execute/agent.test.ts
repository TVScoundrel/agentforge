import { describe, expect, it } from 'vitest';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createMockLLM } from '@agentforge/testing';
import { z } from 'zod';
import { createPlanExecuteAgent } from '../../src/plan-execute/agent.js';

const failingTool = toolBuilder()
  .name('failing-tool')
  .description('Always fails during execution')
  .category(ToolCategory.UTILITY)
  .schema(z.object({}))
  .implement(async () => {
    throw new Error('tool failed');
  })
  .build();

const successTool = toolBuilder()
  .name('success-tool')
  .description('Returns a successful fallback result')
  .category(ToolCategory.UTILITY)
  .schema(z.object({}))
  .implement(async () => 'recovered')
  .build();

function createPlanResponse(goal: string, steps: Array<{ id: string; description: string; tool?: string }>): string {
  return JSON.stringify({
    goal,
    steps,
    confidence: 0.95,
  });
}

describe('Plan-Execute Agent Routing', () => {
  it('routes from replanner back to executor when replanning is declined', async () => {
    const planner = createMockLLM({
      responses: [
        createPlanResponse('Recover from failure', [
          { id: 'step-fail', description: 'Fail once', tool: 'failing-tool' },
          { id: 'step-success', description: 'Recover', tool: 'success-tool' },
        ]),
      ],
    });

    const replanner = createMockLLM({
      responses: [
        JSON.stringify({
          shouldReplan: false,
          reason: 'Continue with the current plan',
        }),
      ],
    });

    const agent = createPlanExecuteAgent({
      planner: { model: planner },
      executor: { tools: [failingTool, successTool] },
      replanner: { model: replanner },
    });

    const result = await agent.invoke({ input: 'recover after one failed step' });

    expect(planner.getCallCount()).toBe(1);
    expect(replanner.getCallCount()).toBe(1);
    expect(result.status).toBe('completed');
    expect(result.pastSteps).toHaveLength(2);
    expect(result.pastSteps[0]?.success).toBe(false);
    expect(result.pastSteps[1]?.success).toBe(true);
    expect(result.pastSteps[1]?.result).toBe('recovered');
  });

  it('routes from replanner back to planner when replanning is requested', async () => {
    const planner = createMockLLM({
      responses: [
        createPlanResponse('Original goal', [
          { id: 'step-fail', description: 'Fail once', tool: 'failing-tool' },
          { id: 'step-stale', description: 'Stale follow-up', tool: 'success-tool' },
        ]),
        createPlanResponse('Retry with fallback', [
          { id: 'step-retry', description: 'Retry with fallback', tool: 'success-tool' },
        ]),
      ],
    });

    const replanner = createMockLLM({
      responses: [
        JSON.stringify({
          shouldReplan: true,
          reason: 'The first attempt failed',
          newGoal: 'Retry with fallback',
        }),
      ],
    });

    const agent = createPlanExecuteAgent({
      planner: { model: planner },
      executor: { tools: [failingTool, successTool] },
      replanner: { model: replanner },
      maxIterations: 3,
    });

    const result = await agent.invoke({ input: 'recover by replanning' });

    expect(planner.getCallCount()).toBe(2);
    expect(replanner.getCallCount()).toBe(1);
    expect(result.status).toBe('completed');
    expect(result.plan?.goal).toBe('Retry with fallback');
    expect(result.pastSteps).toHaveLength(2);
    expect(result.pastSteps[0]?.step.id).toBe('step-fail');
    expect(result.pastSteps[0]?.success).toBe(false);
    expect(result.pastSteps[1]?.step.id).toBe('step-retry');
    expect(result.pastSteps[1]?.success).toBe(true);
  });
});
