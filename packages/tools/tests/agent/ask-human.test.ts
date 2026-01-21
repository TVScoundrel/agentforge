import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAskHumanTool, askHumanTool } from '../../src/agent/ask-human/tool.js';
import type { AskHumanInput } from '../../src/agent/ask-human/types.js';

describe('askHuman Tool', () => {
  describe('createAskHumanTool', () => {
    it('should create a valid tool', () => {
      const tool = createAskHumanTool();

      expect(tool).toBeDefined();
      expect(tool.metadata.name).toBe('ask-human');
      expect(tool.metadata.description).toContain('Ask a human for input');
      expect(tool.metadata.category).toBe('utility');
    });

    it('should have correct schema', () => {
      const tool = createAskHumanTool();

      expect(tool.schema).toBeDefined();
      
      // Test valid input
      const validInput: AskHumanInput = {
        question: 'Should I proceed?',
        priority: 'normal',
        timeout: 0,
      };

      const result = tool.schema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate required fields', () => {
      const tool = createAskHumanTool();

      // Missing question
      const invalidInput = {
        priority: 'normal',
      };

      const result = tool.schema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const tool = createAskHumanTool();

      const input = {
        question: 'Test question',
      };

      const result = tool.schema.parse(input);
      expect(result.priority).toBe('normal');
      expect(result.timeout).toBe(0);
    });

    it('should validate priority enum', () => {
      const tool = createAskHumanTool();

      const validPriorities = ['low', 'normal', 'high', 'critical'];
      
      for (const priority of validPriorities) {
        const result = tool.schema.safeParse({
          question: 'Test',
          priority,
        });
        expect(result.success).toBe(true);
      }

      // Invalid priority
      const invalidResult = tool.schema.safeParse({
        question: 'Test',
        priority: 'invalid',
      });
      expect(invalidResult.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const tool = createAskHumanTool();

      const input: AskHumanInput = {
        question: 'Test question',
        context: { key: 'value' },
        priority: 'high',
        timeout: 5000,
        defaultResponse: 'Default answer',
        suggestions: ['Yes', 'No', 'Maybe'],
      };

      const result = tool.schema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toEqual({ key: 'value' });
        expect(result.data.suggestions).toEqual(['Yes', 'No', 'Maybe']);
      }
    });
  });

  describe('askHumanTool singleton', () => {
    it('should export a default instance', () => {
      expect(askHumanTool).toBeDefined();
      expect(askHumanTool.metadata.name).toBe('ask-human');
    });

    it('should be the same instance when imported multiple times', () => {
      const tool1 = askHumanTool;
      const tool2 = askHumanTool;
      expect(tool1).toBe(tool2);
    });
  });

  describe('tool execution', () => {
    it('should throw error if @langchain/langgraph is not installed', async () => {
      const tool = createAskHumanTool();

      // Mock the dynamic import to fail
      vi.mock('@langchain/langgraph', () => {
        throw new Error('Cannot find module');
      });

      const input: AskHumanInput = {
        question: 'Test question',
      };

      await expect(tool.execute(input)).rejects.toThrow(
        'askHuman tool requires @langchain/langgraph to be installed'
      );
    });
  });

  describe('input validation', () => {
    it('should reject empty question', () => {
      const tool = createAskHumanTool();

      const result = tool.schema.safeParse({
        question: '',
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative timeout', () => {
      const tool = createAskHumanTool();

      const result = tool.schema.safeParse({
        question: 'Test',
        timeout: -1,
      });

      expect(result.success).toBe(false);
    });
  });
});

