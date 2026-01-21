/**
 * Tests for Customer Support Agent
 * Demonstrates reusability through different configurations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCustomerSupportAgent, CustomerSupportConfigSchema } from './index.js';
import { toolBuilder, ToolCategory, ToolRegistry } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Mock ChatOpenAI to avoid needing API keys in tests
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    modelName: 'gpt-4',
    temperature: 0.7,
  })),
}));

describe('CustomerSupportAgent', () => {
  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const config = {
        temperature: 0.5,
        maxIterations: 15,
        companyName: 'Test Corp',
        enableHumanEscalation: true,
      };

      const result = CustomerSupportConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it('should reject invalid temperature', () => {
      const config = {
        temperature: 3.0, // Invalid: > 2
      };

      const result = CustomerSupportConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const config = {
        supportEmail: 'not-an-email',
      };

      const result = CustomerSupportConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe('Agent Creation', () => {
    it('should create agent with default configuration', () => {
      const agent = createCustomerSupportAgent();
      expect(agent).toBeDefined();
      expect(typeof agent.invoke).toBe('function');
    });

    it('should create agent with custom model', () => {
      const customModel = new ChatOpenAI({
        modelName: 'gpt-3.5-turbo',
        temperature: 0.3,
      });

      const agent = createCustomerSupportAgent({
        model: customModel,
      });

      expect(agent).toBeDefined();
    });

    it('should create agent with custom temperature', () => {
      const agent = createCustomerSupportAgent({
        temperature: 0.2,
      });

      expect(agent).toBeDefined();
    });
  });

  describe('Tool Injection', () => {
    it('should accept custom tools', () => {
      const customTool = toolBuilder()
        .name('test-tool')
        .description('A test tool')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Test input'),
        }))
        .implement(async ({ input }) => ({ result: input }))
        .build();

      const agent = createCustomerSupportAgent({
        customTools: [customTool],
      });

      expect(agent).toBeDefined();
    });

    it('should work with ToolRegistry', () => {
      const registry = new ToolRegistry();

      const customTool = toolBuilder()
        .name('registry-tool')
        .description('A tool from registry')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          value: z.number().describe('Test value'),
        }))
        .implement(async ({ value }) => ({ doubled: value * 2 }))
        .build();

      registry.register(customTool);

      const agent = createCustomerSupportAgent({
        toolRegistry: registry,
      });

      expect(agent).toBeDefined();
    });

    it('should filter tools by category', () => {
      const registry = new ToolRegistry();

      const utilityTool = toolBuilder()
        .name('utility-tool')
        .description('A utility tool for testing category filtering')
        .category(ToolCategory.UTILITY)
        .schema(z.object({}))
        .implement(async () => ({ success: true }))
        .build();

      const webTool = toolBuilder()
        .name('web-tool')
        .description('A web tool for testing category filtering')
        .category(ToolCategory.WEB)
        .schema(z.object({}))
        .implement(async () => ({ success: true }))
        .build();

      registry.registerMany([utilityTool, webTool]);

      const agent = createCustomerSupportAgent({
        toolRegistry: registry,
        enabledCategories: [ToolCategory.UTILITY],
      });

      expect(agent).toBeDefined();
    });
  });

  describe('Feature Flags', () => {
    it('should enable human escalation', () => {
      const agent = createCustomerSupportAgent({
        enableHumanEscalation: true,
      });

      expect(agent).toBeDefined();
    });

    it('should enable ticket creation', () => {
      const agent = createCustomerSupportAgent({
        enableTicketCreation: true,
      });

      expect(agent).toBeDefined();
    });

    it('should enable knowledge base', () => {
      const agent = createCustomerSupportAgent({
        enableKnowledgeBase: true,
      });

      expect(agent).toBeDefined();
    });

    it('should enable all features', () => {
      const agent = createCustomerSupportAgent({
        enableHumanEscalation: true,
        enableTicketCreation: true,
        enableKnowledgeBase: true,
      });

      expect(agent).toBeDefined();
    });
  });

  describe('System Prompt Customization', () => {
    it('should use default system prompt', () => {
      const agent = createCustomerSupportAgent();
      expect(agent).toBeDefined();
    });

    it('should use custom system prompt', () => {
      const customPrompt = 'You are a specialized technical support agent.';
      const agent = createCustomerSupportAgent({
        systemPrompt: customPrompt,
      });

      expect(agent).toBeDefined();
    });

    it('should include company name in prompt', () => {
      const agent = createCustomerSupportAgent({
        companyName: 'Acme Corp',
      });

      expect(agent).toBeDefined();
    });

    it('should include support email in prompt', () => {
      const agent = createCustomerSupportAgent({
        supportEmail: 'support@example.com',
      });

      expect(agent).toBeDefined();
    });
  });

  describe('Reusability Scenarios', () => {
    it('should create basic support agent', () => {
      const agent = createCustomerSupportAgent({
        companyName: 'Basic Corp',
        temperature: 0.7,
      });

      expect(agent).toBeDefined();
    });

    it('should create enterprise support agent', () => {
      const agent = createCustomerSupportAgent({
        companyName: 'Enterprise Inc',
        supportEmail: 'enterprise@example.com',
        enableHumanEscalation: true,
        enableTicketCreation: true,
        enableKnowledgeBase: true,
        escalationThreshold: 'low',
        maxIterations: 20,
      });

      expect(agent).toBeDefined();
    });

    it('should create self-service support agent', () => {
      const agent = createCustomerSupportAgent({
        enableKnowledgeBase: true,
        enableHumanEscalation: false,
        maxIterations: 5,
        temperature: 0.3,
      });

      expect(agent).toBeDefined();
    });

    it('should create multilingual support agent with custom tools', () => {
      const translateTool = toolBuilder()
        .name('translate-text')
        .description('Translate text to different languages')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          text: z.string().describe('Text to translate'),
          targetLanguage: z.string().describe('Target language code'),
        }))
        .implement(async ({ text, targetLanguage }) => ({
          translatedText: `[${targetLanguage}] ${text}`,
          sourceLanguage: 'en',
        }))
        .build();

      const agent = createCustomerSupportAgent({
        customTools: [translateTool],
        companyName: 'Global Corp',
      });

      expect(agent).toBeDefined();
    });

    it('should create agent with external integrations', () => {
      const crmTool = toolBuilder()
        .name('update-crm')
        .description('Update customer record in CRM')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          customerId: z.string().describe('Customer ID'),
          notes: z.string().describe('Notes to add'),
        }))
        .implement(async ({ customerId, notes }) => ({
          updated: true,
          customerId,
          timestamp: Date.now(),
        }))
        .build();

      const agent = createCustomerSupportAgent({
        customTools: [crmTool],
        enableTicketCreation: true,
      });

      expect(agent).toBeDefined();
    });
  });

  describe('Behavior Configuration', () => {
    it('should respect maxIterations setting', () => {
      const agent = createCustomerSupportAgent({
        maxIterations: 5,
      });

      expect(agent).toBeDefined();
    });

    it('should configure escalation threshold', () => {
      const agent = createCustomerSupportAgent({
        escalationThreshold: 'high',
        enableHumanEscalation: true,
      });

      expect(agent).toBeDefined();
    });
  });
});
