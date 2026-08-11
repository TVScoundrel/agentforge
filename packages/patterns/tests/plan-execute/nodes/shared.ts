import { describe, it, expect, vi } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { createPlannerNode, createExecutorNode, createReplannerNode, createFinisherNode } from '../../src/plan-execute/nodes.js';
import type { PlanExecuteStateType } from '../../src/plan-execute/state.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { createMockLLM } from '@agentforge/testing';
import { z } from 'zod';

export function createMockPatternLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

export async function importNodesWithMockedPatternLoggers() {
  vi.resetModules();

  const plannerLogger = createMockPatternLogger();
  const executorLogger = createMockPatternLogger();
  const replannerLogger = createMockPatternLogger();
  const loggersByName = new Map([
    ['agentforge:patterns:plan-execute:planner', plannerLogger],
    ['agentforge:patterns:plan-execute:executor', executorLogger],
    ['agentforge:patterns:plan-execute:replanner', replannerLogger],
  ]);

  vi.doMock('../../../src/shared/deduplication.js', async () => {
    const actual = await vi.importActual<typeof import('../../../src/shared/deduplication.js')>(
      '../../../src/shared/deduplication.js'
    );

    return {
      ...actual,
      createPatternLogger: vi.fn((name: string) => loggersByName.get(name) ?? createMockPatternLogger()),
    };
  });

  const nodesModule = await import('../../../src/plan-execute/nodes.js');

  vi.doUnmock('../../../src/shared/deduplication.js');
  vi.resetModules();

  return {
    createExecutorNode: nodesModule.createExecutorNode,
    createReplannerNode: nodesModule.createReplannerNode,
    executorWarn: executorLogger.warn,
    replannerWarn: replannerLogger.warn,
  };
}

// Helper to create mock planner LLM
export function createMockPlannerLLM() {
  return createMockLLM({
    responseGenerator: () => new AIMessage({
      content: JSON.stringify({
        goal: 'Test goal',
        steps: [
          { id: 'step-1', description: 'First step', tool: 'calculator', args: { a: 1, b: 2 } },
          { id: 'step-2', description: 'Second step', dependencies: ['step-1'] },
        ],
        confidence: 0.9,
      }),
    }),
  });
}

// Helper to create mock replanner LLM
export function createMockReplannerLLM(shouldReplan: boolean = false) {
  return createMockLLM({
    responseGenerator: () => new AIMessage({
      content: JSON.stringify({
        shouldReplan,
        reason: shouldReplan ? 'Need to adjust plan' : 'Continue with current plan',
        newGoal: shouldReplan ? 'Updated goal' : undefined,
      }),
    }),
  });
}

// Create a simple calculator tool
export const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform basic arithmetic')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ a, b }) => a + b)
  .build();

export class GraphInterrupt extends Error {}
