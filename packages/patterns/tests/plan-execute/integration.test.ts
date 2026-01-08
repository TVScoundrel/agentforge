import { describe, it, expect } from 'vitest';
import { AIMessage } from '@langchain/core/messages';
import { createPlanExecuteAgent } from '../../src/plan-execute/agent.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

// Mock LLM for planner
class MockPlannerLLM {
  async invoke() {
    return new AIMessage({
      content: JSON.stringify({
        goal: 'Calculate and format result',
        steps: [
          { id: 'step-1', description: 'Add two numbers', tool: 'calculator', args: { a: 10, b: 5 } },
          { id: 'step-2', description: 'Format the result', tool: 'formatter', args: { value: 15 }, dependencies: ['step-1'] },
        ],
        confidence: 0.95,
      }),
    });
  }
}

// Mock LLM for replanner (never replans)
class MockReplannerLLM {
  async invoke() {
    return new AIMessage({
      content: JSON.stringify({
        shouldReplan: false,
        reason: 'All steps completed successfully',
      }),
    });
  }
}

// Create test tools
const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Add two numbers')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }))
  .implement(async ({ a, b }) => a + b)
  .build();

const formatterTool = toolBuilder()
  .name('formatter')
  .description('Format a number')
  .category(ToolCategory.UTILITY)
  .schema(z.object({
    value: z.number().describe('Value to format'),
  }))
  .implement(async ({ value }) => `Result: ${value}`)
  .build();

describe('Plan-Execute Agent Integration', () => {
  it('should create a plan-execute agent', () => {
    const llm = new MockPlannerLLM() as any;
    const agent = createPlanExecuteAgent({
      planner: { model: llm },
      executor: { tools: [calculatorTool, formatterTool] },
    });

    expect(agent).toBeDefined();
  });

  it('should execute a complete plan', async () => {
    const llm = new MockPlannerLLM() as any;
    const agent = createPlanExecuteAgent({
      planner: { model: llm },
      executor: { tools: [calculatorTool, formatterTool] },
    });

    const result = await agent.invoke({
      input: 'Calculate 10 + 5 and format the result',
    });

    expect(result.plan).toBeDefined();
    expect(result.plan?.steps).toHaveLength(2);
    expect(result.pastSteps).toHaveLength(2);
    expect(result.pastSteps?.[0].result).toBe(15);
    expect(result.pastSteps?.[1].result).toBe('Result: 15');
    expect(result.status).toBe('completed');
  });

  it('should handle plan with dependencies', async () => {
    const llm = new MockPlannerLLM() as any;
    const agent = createPlanExecuteAgent({
      planner: { model: llm },
      executor: { tools: [calculatorTool, formatterTool] },
    });

    const result = await agent.invoke({
      input: 'Test dependencies',
    });

    // Verify steps executed in order
    expect(result.pastSteps).toHaveLength(2);
    expect(result.pastSteps?.[0].step.id).toBe('step-1');
    expect(result.pastSteps?.[1].step.id).toBe('step-2');
    
    // Verify second step had dependency
    expect(result.plan?.steps[1].dependencies).toContain('step-1');
  });

  it('should work without replanner', async () => {
    const llm = new MockPlannerLLM() as any;
    const agent = createPlanExecuteAgent({
      planner: { model: llm },
      executor: { tools: [calculatorTool, formatterTool] },
      // No replanner configured
    });

    const result = await agent.invoke({
      input: 'Test without replanner',
    });

    expect(result.status).toBe('completed');
    expect(result.pastSteps).toHaveLength(2);
  });

  it('should work with replanner', async () => {
    const plannerLLM = new MockPlannerLLM() as any;
    const replannerLLM = new MockReplannerLLM() as any;
    
    const agent = createPlanExecuteAgent({
      planner: { model: plannerLLM },
      executor: { tools: [calculatorTool, formatterTool] },
      replanner: { model: replannerLLM },
    });

    const result = await agent.invoke({
      input: 'Test with replanner',
    });

    expect(result.status).toBe('completed');
    expect(result.pastSteps).toHaveLength(2);
  });

  it('should handle empty plan', async () => {
    const llm = {
      invoke: async () => new AIMessage({
        content: JSON.stringify({
          goal: 'Nothing to do',
          steps: [],
          confidence: 1.0,
        }),
      }),
    } as any;

    const agent = createPlanExecuteAgent({
      planner: { model: llm },
      executor: { tools: [] },
    });

    const result = await agent.invoke({
      input: 'Do nothing',
    });

    expect(result.status).toBe('completed');
    expect(result.pastSteps).toHaveLength(0);
  });
});

