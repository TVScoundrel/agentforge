import { describe, it, expect, vi } from 'vitest';
import { ReActAgentBuilder, createReActAgentBuilder } from '../../../../src/langgraph/patterns/react/builder.js';
import { ToolRegistry, toolBuilder, ToolCategory } from '../../../../src/tools/index.js';
import { z } from 'zod';

// Mock LLM
class MockChatModel {
  async invoke() {
    return { content: 'Mock response', tool_calls: [] };
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

const mockLLM = new MockChatModel() as any;

// Mock tools
const mockTool = toolBuilder()
  .name('test-tool')
  .description('A test tool')
  .category(ToolCategory.UTILITY)
  .schema(z.object({ input: z.string().describe('Input') }))
  .implement(async ({ input }) => input)
  .build();

describe('ReActAgentBuilder', () => {
  describe('Builder Pattern', () => {
    it('should create a builder instance', () => {
      const builder = new ReActAgentBuilder();
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should create a builder using factory function', () => {
      const builder = createReActAgentBuilder();
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should support method chaining', () => {
      const builder = new ReActAgentBuilder()
        .withLLM(mockLLM)
        .withTools([mockTool])
        .withSystemPrompt('Test prompt')
        .withMaxIterations(5);

      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });
  });

  describe('Configuration', () => {
    it('should set LLM', () => {
      const builder = new ReActAgentBuilder().withLLM(mockLLM);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set tools as array', () => {
      const builder = new ReActAgentBuilder().withTools([mockTool]);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set tools as registry', () => {
      const registry = new ToolRegistry();
      registry.register(mockTool);
      const builder = new ReActAgentBuilder().withTools(registry);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set system prompt', () => {
      const builder = new ReActAgentBuilder().withSystemPrompt('Custom prompt');
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set max iterations', () => {
      const builder = new ReActAgentBuilder().withMaxIterations(15);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set return intermediate steps', () => {
      const builder = new ReActAgentBuilder().withReturnIntermediateSteps(true);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set stop condition', () => {
      const stopCondition = (state: any) => state.iteration > 5;
      const builder = new ReActAgentBuilder().withStopCondition(stopCondition);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set verbose mode', () => {
      const builder = new ReActAgentBuilder().withVerbose(true);
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });

    it('should set custom node names', () => {
      const builder = new ReActAgentBuilder().withNodeNames({
        reasoning: 'think',
        action: 'act',
        observation: 'observe',
      });
      expect(builder).toBeInstanceOf(ReActAgentBuilder);
    });
  });

  describe('Validation', () => {
    it('should throw error if LLM is missing', () => {
      const builder = new ReActAgentBuilder().withTools([mockTool]);

      expect(() => builder.build()).toThrow('llm is required');
    });

    it('should throw error if tools are missing', () => {
      const builder = new ReActAgentBuilder().withLLM(mockLLM);

      expect(() => builder.build()).toThrow('tools are required');
    });

    it('should build successfully with required fields', () => {
      const builder = new ReActAgentBuilder()
        .withLLM(mockLLM)
        .withTools([mockTool]);

      const agent = builder.build();
      expect(agent).toBeDefined();
      expect(agent.invoke).toBeDefined();
    });
  });

  describe('Defaults', () => {
    it('should use default system prompt if not provided', () => {
      const builder = new ReActAgentBuilder()
        .withLLM(mockLLM)
        .withTools([mockTool]);

      const agent = builder.build();
      expect(agent).toBeDefined();
    });

    it('should use default max iterations (10) if not provided', () => {
      const builder = new ReActAgentBuilder()
        .withLLM(mockLLM)
        .withTools([mockTool]);

      const agent = builder.build();
      expect(agent).toBeDefined();
    });

    it('should use default returnIntermediateSteps (false) if not provided', () => {
      const builder = new ReActAgentBuilder()
        .withLLM(mockLLM)
        .withTools([mockTool]);

      const agent = builder.build();
      expect(agent).toBeDefined();
    });
  });

  describe('Full Configuration', () => {
    it('should build agent with all options', () => {
      const stopCondition = (state: any) => state.iteration > 5;

      const agent = new ReActAgentBuilder()
        .withLLM(mockLLM)
        .withTools([mockTool])
        .withSystemPrompt('You are a helpful assistant')
        .withMaxIterations(20)
        .withReturnIntermediateSteps(true)
        .withStopCondition(stopCondition)
        .withVerbose(true)
        .withNodeNames({ reasoning: 'think', action: 'act', observation: 'observe' })
        .build();

      expect(agent).toBeDefined();
      expect(agent.invoke).toBeDefined();
    });
  });
});

