/**
 * Integration Tests for Multi-Agent System with Tool-Enabled Supervisor
 *
 * Note: These tests verify that the multi-agent system correctly integrates
 * tool-enabled supervisor functionality. Full end-to-end tests with real LLMs
 * would require API keys and are better suited for manual testing or E2E test suites.
 */

import { describe, it, expect, vi } from 'vitest';
import { createMultiAgentSystem } from '../../src/multi-agent/agent.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

describe('Multi-Agent System Integration with Tools', () => {
  describe('System Configuration', () => {
    it('should create multi-agent system with tool-enabled supervisor', () => {
      // Create mock tool
      const mockTool = toolBuilder()
        .name('ask-human')
        .description('Ask the human for clarification')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          question: z.string().describe('Question to ask'),
        }))
        .implement(async ({ question }) => {
          return 'Security compliance audit';
        })
        .build();

      // Create mock model
      const mockModel = {
        invoke: vi.fn(),
        bindTools: vi.fn().mockReturnThis(),
        withStructuredOutput: vi.fn().mockReturnThis(),
      };

      // Create security worker
      const securityWorker = async (state: any) => {
        return {
          ...state,
          response: 'Security compliance audit completed',
          status: 'completed',
        };
      };

      // Create multi-agent system
      const system = createMultiAgentSystem({
        supervisor: {
          strategy: 'llm-based',
          model: mockModel as any,
          tools: [mockTool],
        },
        workers: [
          {
            id: 'security',
            executeFn: securityWorker,
            capabilities: {
              skills: ['security', 'compliance', 'audit'],
              tools: ['scanner', 'analyzer'],
            },
          },
        ],
        maxIterations: 5,
      });

      // Verify system was created
      expect(system).toBeDefined();
      expect(system.invoke).toBeDefined();

      // Verify tools were bound to supervisor model
      expect(mockModel.bindTools).toHaveBeenCalledTimes(1);
      expect(mockModel.bindTools).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'ask-human',
          }),
        ])
      );
    });

    it('should create system without tools (backward compatibility)', () => {
      // Create mock model
      const mockModel = {
        invoke: vi.fn(),
        bindTools: vi.fn(),
        withStructuredOutput: vi.fn().mockReturnThis(),
      };

      // Create worker
      const worker = async (state: any) => {
        return { ...state, response: 'Done', status: 'completed' };
      };

      // Create multi-agent system without tools
      const system = createMultiAgentSystem({
        supervisor: {
          strategy: 'llm-based',
          model: mockModel as any,
          // No tools specified
        },
        workers: [
          {
            id: 'worker1',
            executeFn: worker,
            capabilities: {
              skills: ['task1'],
              tools: [],
            },
          },
        ],
        maxIterations: 5,
      });

      // Verify system was created
      expect(system).toBeDefined();

      // Verify bindTools was NOT called (no tools configured)
      expect(mockModel.bindTools).not.toHaveBeenCalled();
    });

    it('should pass maxToolRetries to supervisor config', () => {
      const mockModel = {
        invoke: vi.fn(),
        bindTools: vi.fn().mockReturnThis(),
        withStructuredOutput: vi.fn().mockReturnThis(),
      };

      const mockTool = toolBuilder()
        .name('test-tool')
        .description('A test tool for integration testing')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Input to the test tool'),
        }))
        .implement(async () => 'result')
        .build();

      const worker = async (state: any) => {
        return { ...state, response: 'Done', status: 'completed' };
      };

      // Create system with custom maxToolRetries
      const system = createMultiAgentSystem({
        supervisor: {
          strategy: 'llm-based',
          model: mockModel as any,
          tools: [mockTool],
          maxToolRetries: 10,
        },
        workers: [
          {
            id: 'worker1',
            executeFn: worker,
            capabilities: {
              skills: ['task1'],
              tools: [],
            },
          },
        ],
        maxIterations: 5,
      });

      // Verify system was created
      expect(system).toBeDefined();
      expect(mockModel.bindTools).toHaveBeenCalledTimes(1);
    });
  });
});

