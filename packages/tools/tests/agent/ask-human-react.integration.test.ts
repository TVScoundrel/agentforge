import { describe, it, expect, vi } from 'vitest';
import { createAskHumanTool } from '../../src/agent/ask-human/index.js';
import type { AskHumanInput, AskHumanOutput } from '../../src/agent/ask-human/types.js';

/**
 * Integration tests for askHuman tool
 *
 * Note: These tests verify that the askHuman tool integrates correctly with
 * agent patterns. Testing the actual LangGraph interrupt() mechanism requires
 * a full LangGraph execution context with checkpointing, which is tested in
 * the LangGraph library itself.
 *
 * These tests focus on:
 * 1. Tool can be created and has correct metadata
 * 2. Tool input validation works correctly
 * 3. Tool can be used in agent tool arrays
 * 4. Tool output format is correct
 */
describe('askHuman Tool - Agent Integration', () => {
  describe('tool creation and metadata', () => {
    it('should create askHuman tool with correct metadata', () => {
      const tool = createAskHumanTool();

      expect(tool).toBeDefined();
      expect(tool.metadata.name).toBe('ask-human');
      expect(tool.metadata.description).toContain('Ask a human for input');
      expect(tool.metadata.category).toBe('utility');
    });

    it('should have correct schema for validation', () => {
      const tool = createAskHumanTool();

      // Valid input should pass validation
      const validInput: AskHumanInput = {
        question: 'What is your name?',
        priority: 'normal',
      };

      expect(() => tool.schema.parse(validInput)).not.toThrow();
    });

    it('should validate required fields', () => {
      const tool = createAskHumanTool();

      // Missing question should fail
      const invalidInput = {
        priority: 'normal',
      };

      expect(() => tool.schema.parse(invalidInput)).toThrow();
    });

    it('should validate priority enum', () => {
      const tool = createAskHumanTool();

      // Invalid priority should fail
      const invalidInput = {
        question: 'Test?',
        priority: 'invalid',
      };

      expect(() => tool.schema.parse(invalidInput)).toThrow();
    });
  });

  describe('tool array integration', () => {
    it('should work in a tools array with other tools', () => {
      const askHuman = createAskHumanTool();

      // Simulate how it would be used in an agent
      const tools = [askHuman];

      expect(tools).toHaveLength(1);
      expect(tools[0].metadata.name).toBe('ask-human');
    });

    it('should be findable by name in tool registry pattern', () => {
      const askHuman = createAskHumanTool();
      const tools = [askHuman];

      const foundTool = tools.find(t => t.metadata.name === 'ask-human');
      expect(foundTool).toBeDefined();
      expect(foundTool?.metadata.name).toBe('ask-human');
    });
  });

  describe('input/output format', () => {
    it('should accept all valid input fields', () => {
      const tool = createAskHumanTool();

      const fullInput: AskHumanInput = {
        question: 'Do you approve this action?',
        context: { action: 'delete_user', userId: '123' },
        priority: 'high',
        timeout: 30000,
        defaultResponse: 'no',
        suggestions: ['yes', 'no', 'cancel'],
      };

      expect(() => tool.schema.parse(fullInput)).not.toThrow();
    });

    it('should use default values for optional fields', () => {
      const tool = createAskHumanTool();

      const minimalInput = {
        question: 'Test question?',
      };

      const parsed = tool.schema.parse(minimalInput);
      expect(parsed.priority).toBe('normal');
      expect(parsed.timeout).toBe(0);
    });

    it('should validate timeout is non-negative', () => {
      const tool = createAskHumanTool();

      const invalidInput = {
        question: 'Test?',
        timeout: -1000,
      };

      expect(() => tool.schema.parse(invalidInput)).toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error when called outside LangGraph context', async () => {
      // When called outside a LangGraph execution context, interrupt() will throw
      const tool = createAskHumanTool();
      const input: AskHumanInput = {
        question: 'Test question',
      };

      // The tool will throw because interrupt() is called outside a graph context
      await expect(tool.invoke(input)).rejects.toThrow();
    });

    it('should validate input before execution', async () => {
      const tool = createAskHumanTool();

      // Invalid input (missing question)
      const invalidInput = {} as AskHumanInput;

      // Should throw validation error
      await expect(tool.invoke(invalidInput)).rejects.toThrow();
    });
  });
});

