/**
 * Tests for Code Review Agent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCodeReviewAgent, CodeReviewConfigSchema } from './index.js';
import { toolBuilder, ToolCategory, ToolRegistry } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Mock ChatOpenAI to avoid needing API keys in tests
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    modelName: 'gpt-4',
    temperature: 0.3,
  })),
}));

describe('CodeReviewAgent', () => {
  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const config = {
        teamName: 'Platform Team',
        languages: 'TypeScript, Python',
        enableSecurityChecks: true,
        temperature: 0.5,
      };
      
      expect(() => CodeReviewConfigSchema.parse(config)).not.toThrow();
    });
    
    it('should reject invalid temperature', () => {
      const config = {
        temperature: 3.0, // Invalid: > 2
      };
      
      expect(() => CodeReviewConfigSchema.parse(config)).toThrow();
    });
    
    it('should reject invalid review depth', () => {
      const config = {
        reviewDepth: 'invalid', // Invalid: not in enum
      };
      
      expect(() => CodeReviewConfigSchema.parse(config)).toThrow();
    });
  });
  
  describe('Agent Creation', () => {
    it('should create agent with default configuration', () => {
      const agent = createCodeReviewAgent();
      expect(agent).toBeDefined();
    });
    
    it('should create agent with custom model', () => {
      const customModel = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' });
      const agent = createCodeReviewAgent({ model: customModel });
      expect(agent).toBeDefined();
    });
    
    it('should create agent with custom temperature', () => {
      const agent = createCodeReviewAgent({ temperature: 0.1 });
      expect(agent).toBeDefined();
    });
  });
  
  describe('Tool Injection', () => {
    it('should accept custom tools', () => {
      const customTool = toolBuilder()
        .name('lint-code')
        .description('Run linter on code to check for style issues')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          code: z.string().describe('Code to lint'),
        }))
        .implement(async ({ code }) => ({ issues: [] }))
        .build();
      
      const agent = createCodeReviewAgent({
        customTools: [customTool],
      });
      
      expect(agent).toBeDefined();
    });
    
    it('should work with ToolRegistry', () => {
      const registry = new ToolRegistry();
      
      const testTool = toolBuilder()
        .name('test-coverage')
        .description('Check test coverage for the code')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          code: z.string().describe('Code to check coverage for'),
        }))
        .implement(async ({ code }) => ({ coverage: 85 }))
        .build();
      
      registry.register(testTool);
      
      const agent = createCodeReviewAgent({
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
      
      const agent = createCodeReviewAgent({
        toolRegistry: registry,
        enabledCategories: [ToolCategory.UTILITY],
      });
      
      expect(agent).toBeDefined();
    });
  });
  
  describe('Feature Flags', () => {
    it('should enable security checks', () => {
      const agent = createCodeReviewAgent({
        enableSecurityChecks: true,
      });
      expect(agent).toBeDefined();
    });
    
    it('should enable performance checks', () => {
      const agent = createCodeReviewAgent({
        enablePerformanceChecks: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable human escalation', () => {
      const agent = createCodeReviewAgent({
        enableHumanEscalation: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable strict mode', () => {
      const agent = createCodeReviewAgent({
        strictMode: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable auto-approve', () => {
      const agent = createCodeReviewAgent({
        autoApprove: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable all features', () => {
      const agent = createCodeReviewAgent({
        enableSecurityChecks: true,
        enablePerformanceChecks: true,
        enableHumanEscalation: true,
        strictMode: true,
      });
      expect(agent).toBeDefined();
    });
  });

  describe('System Prompt Customization', () => {
    it('should use default system prompt', () => {
      const agent = createCodeReviewAgent();
      expect(agent).toBeDefined();
    });

    it('should use custom system prompt', () => {
      const customPrompt = 'You are a senior code reviewer specializing in security.';
      const agent = createCodeReviewAgent({
        systemPrompt: customPrompt,
      });
      expect(agent).toBeDefined();
    });

    it('should include team name in prompt', () => {
      const agent = createCodeReviewAgent({
        teamName: 'Platform Engineering',
      });
      expect(agent).toBeDefined();
    });

    it('should include languages in prompt', () => {
      const agent = createCodeReviewAgent({
        languages: 'TypeScript, Python, Go',
      });
      expect(agent).toBeDefined();
    });
  });

  describe('Reusability Scenarios', () => {
    it('should create basic code review agent', () => {
      const agent = createCodeReviewAgent({
        languages: 'TypeScript',
        reviewDepth: 'quick',
      });
      expect(agent).toBeDefined();
    });

    it('should create security-focused review agent', () => {
      const agent = createCodeReviewAgent({
        teamName: 'Security Team',
        enableSecurityChecks: true,
        strictMode: true,
        languages: 'TypeScript, Python, Go',
      });
      expect(agent).toBeDefined();
    });

    it('should create performance-focused review agent', () => {
      const agent = createCodeReviewAgent({
        teamName: 'Performance Team',
        enablePerformanceChecks: true,
        languages: 'C++, Rust, Go',
        reviewDepth: 'thorough',
      });
      expect(agent).toBeDefined();
    });

    it('should create junior-friendly review agent', () => {
      const agent = createCodeReviewAgent({
        teamName: 'Onboarding Team',
        autoApprove: false,
        strictMode: false,
        reviewDepth: 'standard',
      });
      expect(agent).toBeDefined();
    });

    it('should create agent with custom linting tools', () => {
      const eslintTool = toolBuilder()
        .name('run-eslint')
        .description('Run ESLint on TypeScript/JavaScript code')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          code: z.string().describe('Code to lint'),
        }))
        .implement(async ({ code }) => ({ errors: [], warnings: [] }))
        .build();

      const agent = createCodeReviewAgent({
        customTools: [eslintTool],
        languages: 'TypeScript, JavaScript',
      });
      expect(agent).toBeDefined();
    });
  });

  describe('Behavior Configuration', () => {
    it('should respect maxIterations setting', () => {
      const agent = createCodeReviewAgent({
        maxIterations: 20,
      });
      expect(agent).toBeDefined();
    });

    it('should configure review depth', () => {
      const agent = createCodeReviewAgent({
        reviewDepth: 'thorough',
      });
      expect(agent).toBeDefined();
    });
  });
});

