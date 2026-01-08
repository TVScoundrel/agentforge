import { describe, it, expect, vi } from 'vitest';
import { ReActAgentBuilder, createReActAgent } from '../../../../src/langgraph/patterns/react/index.js';
import { toolBuilder, ToolCategory } from '../../../../src/tools/index.js';
import { z } from 'zod';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

// Mock LLM that simulates tool calling
class MockLLMWithToolCalls {
  private callCount = 0;

  async invoke(messages: any[]) {
    this.callCount++;

    // First call: decide to use a tool
    if (this.callCount === 1) {
      return new AIMessage({
        content: '',
        tool_calls: [
          {
            id: 'call_1',
            name: 'calculator',
            args: { operation: 'add', a: 5, b: 3 },
          },
        ],
      });
    }

    // Second call: provide final answer
    return new AIMessage({
      content: 'The result is 8',
      tool_calls: [],
    });
  }

  bind() {
    return this;
  }

  bindTools() {
    return this;
  }
}

// Create a simple calculator tool
const calculatorTool = toolBuilder()
  .name('calculator')
  .description('Perform basic arithmetic operations')
  .category(ToolCategory.UTILITY)
  .schema(
    z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The operation to perform'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number'),
    })
  )
  .implement(async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return a / b;
    }
  })
  .build();

describe('ReAct Agent Integration', () => {
  it('should execute a complete ReAct loop with tool calling', async () => {
    const mockLLM = new MockLLMWithToolCalls() as any;

    const agent = createReActAgent({
      model: mockLLM,
      tools: [calculatorTool],
      maxIterations: 5,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 5 + 3?')],
    });

    expect(result).toBeDefined();
    expect(result.response).toBe('The result is 8');
    expect(result.iteration).toBeGreaterThan(0);
  });

  it('should work with fluent builder API', async () => {
    const mockLLM = new MockLLMWithToolCalls() as any;

    const agent = new ReActAgentBuilder()
      .withLLM(mockLLM)
      .withTools([calculatorTool])
      .withMaxIterations(5)
      .withReturnIntermediateSteps(true)
      .build();

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 5 + 3?')],
    });

    expect(result).toBeDefined();
    expect(result.response).toBe('The result is 8');
  });

  it('should respect max iterations', async () => {
    // Mock LLM that always tries to call tools
    class AlwaysCallToolsLLM {
      async invoke() {
        return new AIMessage({
          content: '',
          tool_calls: [
            {
              id: 'call_1',
              name: 'calculator',
              args: { operation: 'add', a: 1, b: 1 },
            },
          ],
        });
      }

      bind() {
        return this;
      }

      bindTools() {
        return this;
      }
    }

    const mockLLM = new AlwaysCallToolsLLM() as any;

    const agent = createReActAgent({
      model: mockLLM,
      tools: [calculatorTool],
      maxIterations: 3,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('Keep calculating')],
    });

    expect(result.iteration).toBe(3);
  });

  it('should handle tool execution errors gracefully', async () => {
    // Tool that throws an error
    const errorTool = toolBuilder()
      .name('error-tool')
      .description('A tool that throws an error')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async () => {
        throw new Error('Tool execution failed');
      })
      .build();

    class CallErrorToolLLM {
      private callCount = 0;

      async invoke() {
        this.callCount++;

        if (this.callCount === 1) {
          return new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_1',
                name: 'error-tool',
                args: { input: 'test' },
              },
            ],
          });
        }

        return new AIMessage({
          content: 'I encountered an error',
          tool_calls: [],
        });
      }

      bind() {
        return this;
      }

      bindTools() {
        return this;
      }
    }

    const mockLLM = new CallErrorToolLLM() as any;

    const agent = createReActAgent({
      model: mockLLM,
      tools: [errorTool],
      maxIterations: 5,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('Test error handling')],
    });

    expect(result).toBeDefined();
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].error).toContain('Tool execution failed');
  });

  it('should handle tool not found errors', async () => {
    class CallNonExistentToolLLM {
      private callCount = 0;

      async invoke() {
        this.callCount++;

        if (this.callCount === 1) {
          return new AIMessage({
            content: '',
            tool_calls: [
              {
                id: 'call_1',
                name: 'non-existent-tool',
                args: { input: 'test' },
              },
            ],
          });
        }

        return new AIMessage({
          content: 'Tool not found',
          tool_calls: [],
        });
      }

      bind() {
        return this;
      }

      bindTools() {
        return this;
      }
    }

    const mockLLM = new CallNonExistentToolLLM() as any;

    const agent = createReActAgent({
      model: mockLLM,
      tools: [calculatorTool],
      maxIterations: 5,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('Test tool not found')],
    });

    expect(result).toBeDefined();
    expect(result.observations).toHaveLength(1);
    expect(result.observations[0].error).toContain("Tool 'non-existent-tool' not found");
  });

  it('should support custom stop conditions', async () => {
    const mockLLM = new MockLLMWithToolCalls() as any;
    const stopCondition = vi.fn((state) => state.iteration >= 1);

    const agent = createReActAgent({
      model: mockLLM,
      tools: [calculatorTool],
      maxIterations: 10,
      stopCondition,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 5 + 3?')],
    });

    expect(result).toBeDefined();
    expect(stopCondition).toHaveBeenCalled();
    expect(result.iteration).toBeLessThanOrEqual(1);
  });

  it('should accumulate scratchpad entries', async () => {
    const mockLLM = new MockLLMWithToolCalls() as any;

    const agent = createReActAgent({
      model: mockLLM,
      tools: [calculatorTool],
      maxIterations: 5,
      returnIntermediateSteps: true,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('What is 5 + 3?')],
    });

    expect(result).toBeDefined();
    expect(result.scratchpad).toBeDefined();
    expect(result.scratchpad.length).toBeGreaterThan(0);
    expect(result.scratchpad[0]).toHaveProperty('step');
    expect(result.scratchpad[0]).toHaveProperty('thought');
    expect(result.scratchpad[0]).toHaveProperty('action');
    expect(result.scratchpad[0]).toHaveProperty('observation');
  });
});

