import { describe, it, expect, vi } from 'vitest';
import { createReActAgent } from '../../../../src/langgraph/patterns/react/agent.js';
import { ToolRegistry, toolBuilder, ToolCategory } from '../../../../src/tools/index.js';
import { z } from 'zod';

// Mock LLM for testing
class MockChatModel {
  async invoke() {
    return { content: 'Mock response' };
  }
  
  async stream() {
    return [];
  }

  bind() {
    return this;
  }

  bindTools() {
    return this;
  }
}

describe('ReAct Agent Builder', () => {
  it('should create a compiled StateGraph', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
    });

    expect(agent).toBeDefined();
    expect(typeof agent.invoke).toBe('function');
  });

  it('should accept ToolRegistry as tools', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const tool = toolBuilder()
      .name('test-tool')
      .description('A test tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();

    registry.register(tool);

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
    });

    expect(agent).toBeDefined();
  });

  it('should accept array of Tools', () => {
    const mockLLM = new MockChatModel() as any;

    const tool = toolBuilder()
      .name('test-tool')
      .description('A test tool')
      .category(ToolCategory.UTILITY)
      .schema(z.object({ input: z.string().describe('Input') }))
      .implement(async ({ input }) => input)
      .build();

    const agent = createReActAgent({
      llm: mockLLM,
      tools: [tool],
    });

    expect(agent).toBeDefined();
  });

  it('should use default configuration values', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
    });

    // Agent should be created with defaults
    expect(agent).toBeDefined();
  });

  it('should accept custom system prompt', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
      systemPrompt: 'Custom system prompt',
    });

    expect(agent).toBeDefined();
  });

  it('should accept custom maxIterations', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
      maxIterations: 5,
    });

    expect(agent).toBeDefined();
  });

  it('should accept returnIntermediateSteps option', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
      returnIntermediateSteps: true,
    });

    expect(agent).toBeDefined();
  });

  it('should accept custom stop condition', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const stopCondition = vi.fn((state) => state.iteration >= 3);

    const agent = createReActAgent({
      llm: mockLLM,
      tools: registry,
      stopCondition,
    });

    expect(agent).toBeDefined();
  });

  it('should accept builder options', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent(
      {
        llm: mockLLM,
        tools: registry,
      },
      {
        verbose: true,
        nodeNames: {
          reasoning: 'custom-reasoning',
          action: 'custom-action',
          observation: 'custom-observation',
        },
      }
    );

    expect(agent).toBeDefined();
  });

  it('should create agent with all configuration options', () => {
    const mockLLM = new MockChatModel() as any;
    const registry = new ToolRegistry();

    const agent = createReActAgent(
      {
        llm: mockLLM,
        tools: registry,
        systemPrompt: 'Custom prompt',
        maxIterations: 5,
        returnIntermediateSteps: true,
        stopCondition: (state) => state.iteration >= 3,
      },
      {
        verbose: true,
        nodeNames: {
          reasoning: 'think',
          action: 'act',
          observation: 'observe',
        },
      }
    );

    expect(agent).toBeDefined();
    expect(typeof agent.invoke).toBe('function');
  });
});

