import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { create{{AGENT_NAME_PASCAL}}Agent, {{AGENT_NAME_PASCAL}}ConfigSchema } from './index.js';
import { toolBuilder, ToolCategory, ToolRegistry } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';

describe('{{AGENT_NAME_PASCAL}}Agent', () => {
  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const config = {
        temperature: 0.7,
        organizationName: 'Test Org',
        enableExampleFeature: true,
      };

      expect(() => {{AGENT_NAME_PASCAL}}ConfigSchema.parse(config)).not.toThrow();
    });

    it('should reject invalid temperature', () => {
      const config = {
        temperature: 3.0, // Invalid: > 2
      };

      expect(() => {{AGENT_NAME_PASCAL}}ConfigSchema.parse(config)).toThrow();
    });

    it('should accept empty configuration', () => {
      expect(() => {{AGENT_NAME_PASCAL}}ConfigSchema.parse({})).not.toThrow();
    });
  });

  describe('Agent Creation', () => {
    it('should create agent with default configuration', () => {
      const agent = create{{AGENT_NAME_PASCAL}}Agent();
      expect(agent).toBeDefined();
      expect(typeof agent.invoke).toBe('function');
    });

    it('should create agent with custom model', () => {
      const customModel = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.3,
      });

      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        model: customModel,
      });

      expect(agent).toBeDefined();
    });

    it('should create agent with custom temperature', () => {
      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        temperature: 0.2,
      });

      expect(agent).toBeDefined();
    });
  });

  describe('Tool Injection', () => {
    it('should accept custom tools', () => {
      const customTool = toolBuilder()
        .name('custom-tool')
        .description('A custom tool for testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Test input'),
        }))
        .implement(async ({ input }) => ({ result: input }))
        .build();

      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        customTools: [customTool],
      });

      expect(agent).toBeDefined();
    });

    it('should accept tool registry', () => {
      const registry = new ToolRegistry();
      
      const tool = toolBuilder()
        .name('registry-tool')
        .description('A tool from registry')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Test input'),
        }))
        .implement(async ({ input }) => ({ result: input }))
        .build();

      registry.register(tool);

      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        toolRegistry: registry,
      });

      expect(agent).toBeDefined();
    });

    it('should filter tools by category', () => {
      const registry = new ToolRegistry();
      
      const utilityTool = toolBuilder()
        .name('utility-tool')
        .description('A utility tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({}))
        .implement(async () => ({ result: 'utility' }))
        .build();

      registry.register(utilityTool);

      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        toolRegistry: registry,
        enabledCategories: [ToolCategory.UTILITY],
      });

      expect(agent).toBeDefined();
    });
  });

  describe('Feature Flags', () => {
    it('should enable example feature by default', () => {
      const agent = create{{AGENT_NAME_PASCAL}}Agent();
      expect(agent).toBeDefined();
    });

    it('should disable example feature when configured', () => {
      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        enableExampleFeature: false,
      });
      expect(agent).toBeDefined();
    });
  });

  describe('System Prompt Customization', () => {
    it('should use default system prompt', () => {
      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        organizationName: 'Test Org',
      });
      expect(agent).toBeDefined();
    });

    it('should accept custom system prompt', () => {
      const customPrompt = 'You are a custom agent with specific instructions.';
      const agent = create{{AGENT_NAME_PASCAL}}Agent({
        systemPrompt: customPrompt,
      });
      expect(agent).toBeDefined();
    });
  });
});

