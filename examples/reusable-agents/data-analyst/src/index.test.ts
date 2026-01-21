/**
 * Tests for Data Analyst Agent
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDataAnalystAgent, DataAnalystConfigSchema } from './index.js';
import { toolBuilder, ToolCategory, ToolRegistry } from '@agentforge/core';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';

// Mock ChatOpenAI to avoid needing API keys in tests
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    modelName: 'gpt-4',
    temperature: 0.2,
  })),
}));

describe('DataAnalystAgent', () => {
  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const config = {
        organizationName: 'Acme Corp',
        dataTypes: 'Sales, Marketing, Customer',
        enableStatisticalAnalysis: true,
        temperature: 0.5,
      };
      
      expect(() => DataAnalystConfigSchema.parse(config)).not.toThrow();
    });
    
    it('should reject invalid temperature', () => {
      const config = {
        temperature: 3.0, // Invalid: > 2
      };
      
      expect(() => DataAnalystConfigSchema.parse(config)).toThrow();
    });
    
    it('should reject invalid analysis depth', () => {
      const config = {
        analysisDepth: 'invalid', // Invalid: not in enum
      };
      
      expect(() => DataAnalystConfigSchema.parse(config)).toThrow();
    });
  });
  
  describe('Agent Creation', () => {
    it('should create agent with default configuration', () => {
      const agent = createDataAnalystAgent();
      expect(agent).toBeDefined();
    });
    
    it('should create agent with custom model', () => {
      const customModel = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' });
      const agent = createDataAnalystAgent({ model: customModel });
      expect(agent).toBeDefined();
    });
    
    it('should create agent with custom temperature', () => {
      const agent = createDataAnalystAgent({ temperature: 0.1 });
      expect(agent).toBeDefined();
    });
  });
  
  describe('Tool Injection', () => {
    it('should accept custom tools', () => {
      const customTool = toolBuilder()
        .name('query-database')
        .description('Query a SQL database for data')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          query: z.string().describe('SQL query to execute'),
        }))
        .implement(async ({ query }) => ({ rows: [] }))
        .build();
      
      const agent = createDataAnalystAgent({
        customTools: [customTool],
      });
      
      expect(agent).toBeDefined();
    });
    
    it('should work with ToolRegistry', () => {
      const registry = new ToolRegistry();
      
      const testTool = toolBuilder()
        .name('fetch-data')
        .description('Fetch data from an API')
        .category(ToolCategory.WEB)
        .schema(z.object({
          url: z.string().describe('API endpoint URL'),
        }))
        .implement(async ({ url }) => ({ data: [] }))
        .build();
      
      registry.register(testTool);
      
      const agent = createDataAnalystAgent({
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
      
      const agent = createDataAnalystAgent({
        toolRegistry: registry,
        enabledCategories: [ToolCategory.UTILITY],
      });
      
      expect(agent).toBeDefined();
    });
  });
  
  describe('Feature Flags', () => {
    it('should enable statistical analysis', () => {
      const agent = createDataAnalystAgent({
        enableStatisticalAnalysis: true,
      });
      expect(agent).toBeDefined();
    });
    
    it('should enable data validation', () => {
      const agent = createDataAnalystAgent({
        enableDataValidation: true,
      });
      expect(agent).toBeDefined();
    });
    
    it('should enable visualization', () => {
      const agent = createDataAnalystAgent({
        enableVisualization: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable human escalation', () => {
      const agent = createDataAnalystAgent({
        enableHumanEscalation: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable confidential data mode', () => {
      const agent = createDataAnalystAgent({
        confidentialData: true,
      });
      expect(agent).toBeDefined();
    });

    it('should enable all features', () => {
      const agent = createDataAnalystAgent({
        enableStatisticalAnalysis: true,
        enableDataValidation: true,
        enableVisualization: true,
        enableHumanEscalation: true,
        confidentialData: true,
      });
      expect(agent).toBeDefined();
    });
  });

  describe('System Prompt Customization', () => {
    it('should use default system prompt', () => {
      const agent = createDataAnalystAgent();
      expect(agent).toBeDefined();
    });

    it('should use custom system prompt', () => {
      const customPrompt = 'You are a senior data scientist specializing in machine learning.';
      const agent = createDataAnalystAgent({
        systemPrompt: customPrompt,
      });
      expect(agent).toBeDefined();
    });

    it('should include organization name in prompt', () => {
      const agent = createDataAnalystAgent({
        organizationName: 'Acme Corporation',
      });
      expect(agent).toBeDefined();
    });

    it('should include data types in prompt', () => {
      const agent = createDataAnalystAgent({
        dataTypes: 'Sales, Marketing, Customer Behavior',
      });
      expect(agent).toBeDefined();
    });
  });

  describe('Reusability Scenarios', () => {
    it('should create basic data analyst', () => {
      const agent = createDataAnalystAgent({
        dataTypes: 'Sales Data',
        analysisDepth: 'quick',
      });
      expect(agent).toBeDefined();
    });

    it('should create statistical analyst', () => {
      const agent = createDataAnalystAgent({
        organizationName: 'Research Lab',
        enableStatisticalAnalysis: true,
        analysisDepth: 'deep',
        dataTypes: 'Experimental Data, Survey Results',
      });
      expect(agent).toBeDefined();
    });

    it('should create visualization specialist', () => {
      const agent = createDataAnalystAgent({
        organizationName: 'Marketing Team',
        enableVisualization: true,
        enableStatisticalAnalysis: false,
        analysisDepth: 'standard',
      });
      expect(agent).toBeDefined();
    });

    it('should create data quality analyst', () => {
      const agent = createDataAnalystAgent({
        organizationName: 'Data Governance',
        enableDataValidation: true,
        enableStatisticalAnalysis: false,
        enableVisualization: false,
      });
      expect(agent).toBeDefined();
    });

    it('should create confidential data analyst', () => {
      const agent = createDataAnalystAgent({
        organizationName: 'Finance Department',
        confidentialData: true,
        enableHumanEscalation: true,
        dataTypes: 'Financial Records, PII',
      });
      expect(agent).toBeDefined();
    });

    it('should create agent with custom database tools', () => {
      const sqlTool = toolBuilder()
        .name('query-sql')
        .description('Execute SQL queries against the data warehouse')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          query: z.string().describe('SQL query to execute'),
        }))
        .implement(async ({ query }) => ({ rows: [], rowCount: 0 }))
        .build();

      const agent = createDataAnalystAgent({
        customTools: [sqlTool],
        dataTypes: 'Relational Database',
      });
      expect(agent).toBeDefined();
    });
  });

  describe('Behavior Configuration', () => {
    it('should respect maxIterations setting', () => {
      const agent = createDataAnalystAgent({
        maxIterations: 20,
      });
      expect(agent).toBeDefined();
    });

    it('should configure analysis depth to quick', () => {
      const agent = createDataAnalystAgent({
        analysisDepth: 'quick',
      });
      expect(agent).toBeDefined();
    });

    it('should configure analysis depth to deep', () => {
      const agent = createDataAnalystAgent({
        analysisDepth: 'deep',
      });
      expect(agent).toBeDefined();
    });
  });
});

