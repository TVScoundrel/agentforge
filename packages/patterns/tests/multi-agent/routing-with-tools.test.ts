/**
 * Tests for Multi-Agent Routing with Tool Support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { llmBasedRouting } from '../../src/multi-agent/routing.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { SupervisorConfig } from '../../src/multi-agent/types.js';
import { toolBuilder, ToolCategory } from '@agentforge/core';
import { z } from 'zod';

describe('Multi-Agent Routing with Tools', () => {
  const mockState: MultiAgentStateType = {
    input: 'I need help with something',
    messages: [{
      from: 'user',
      to: ['supervisor'],
      type: 'user_input',
      content: 'I need help with something',
      timestamp: Date.now(),
    }],
    workers: {
      'hr': {
        skills: ['hr', 'employee-management'],
        tools: ['slack', 'database'],
        available: true,
        currentWorkload: 0,
      },
      'security': {
        skills: ['security', 'compliance'],
        tools: ['audit', 'scan'],
        available: true,
        currentWorkload: 0,
      },
    },
    currentAgent: 'supervisor',
    routingHistory: [],
    activeAssignments: [],
    completedTasks: [],
    handoffs: [],
    status: 'routing',
    iteration: 0,
    maxIterations: 10,
    response: '',
  };

  describe('Tool Call Detection', () => {
    it('should detect and execute tool calls from LLM', async () => {
      // Create a mock tool
      const mockTool = toolBuilder()
        .name('ask-human')
        .description('Ask the human for clarification')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          question: z.string().describe('Question to ask'),
        }))
        .implement(async ({ question }) => {
          return `User answered: More details about HR policy`;
        })
        .build();

      // Create a mock model that first calls the tool, then returns routing decision
      const mockModel = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            tool_calls: [{
              id: 'call_123',
              name: 'ask-human',
              args: { question: 'What specifically do you need help with?' },
            }],
          })
          .mockResolvedValueOnce({
            content: JSON.stringify({
              targetAgent: 'hr',
              reasoning: 'User needs help with HR policy',
              confidence: 0.9,
            }),
            tool_calls: [],
          }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(decision.targetAgent).toBe('hr');
      expect(decision.reasoning).toBe('User needs help with HR policy');
      expect(decision.confidence).toBe(0.9);
      expect(mockModel.invoke).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple tool calls before routing', async () => {
      const mockTool = toolBuilder()
        .name('ask-human')
        .description('Ask the human for clarification')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          question: z.string().describe('Question to ask'),
        }))
        .implement(async ({ question }) => {
          return `User answered: ${question}`;
        })
        .build();

      const mockModel = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            tool_calls: [{
              id: 'call_1',
              name: 'ask-human',
              args: { question: 'What department?' },
            }],
          })
          .mockResolvedValueOnce({
            content: '',
            tool_calls: [{
              id: 'call_2',
              name: 'ask-human',
              args: { question: 'What specific issue?' },
            }],
          })
          .mockResolvedValueOnce({
            content: JSON.stringify({
              targetAgent: 'security',
              reasoning: 'Security compliance issue',
              confidence: 0.95,
            }),
            tool_calls: [],
          }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
        maxToolRetries: 5,
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(decision.targetAgent).toBe('security');
      expect(mockModel.invoke).toHaveBeenCalledTimes(3);
    });
  });

  describe('Tool Call Retry Logic', () => {
    it('should enforce max retry limit', async () => {
      const mockTool = toolBuilder()
        .name('ask-human')
        .description('Ask the human for clarification')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          question: z.string().describe('Question to ask'),
        }))
        .implement(async ({ question }) => {
          return `User answered: ${question}`;
        })
        .build();

      // Mock model that keeps calling tools without routing
      const mockModel = {
        invoke: vi.fn().mockResolvedValue({
          content: '',
          tool_calls: [{
            id: 'call_infinite',
            name: 'ask-human',
            args: { question: 'Another question?' },
          }],
        }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
        maxToolRetries: 3,
      };

      await expect(llmBasedRouting.route(mockState, config))
        .rejects.toThrow('Max tool retries (3) exceeded without routing decision');

      expect(mockModel.invoke).toHaveBeenCalledTimes(3);
    });

    it('should use default max retry limit of 3', async () => {
      const mockTool = toolBuilder()
        .name('ask-human')
        .description('Ask the human for clarification')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          question: z.string().describe('Question to ask'),
        }))
        .implement(async ({ question }) => {
          return `User answered: ${question}`;
        })
        .build();

      const mockModel = {
        invoke: vi.fn().mockResolvedValue({
          content: '',
          tool_calls: [{
            id: 'call_infinite',
            name: 'ask-human',
            args: { question: 'Another question?' },
          }],
        }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
        // No maxToolRetries specified - should default to 3
      };

      await expect(llmBasedRouting.route(mockState, config))
        .rejects.toThrow('Max tool retries (3) exceeded without routing decision');

      expect(mockModel.invoke).toHaveBeenCalledTimes(3);
    });

    it('should accumulate conversation history across retries', async () => {
      const mockTool = toolBuilder()
        .name('ask-human')
        .description('Ask the human for clarification')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          question: z.string().describe('Question to ask'),
        }))
        .implement(async ({ question }) => {
          return `Answer to: ${question}`;
        })
        .build();

      const mockModel = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            tool_calls: [{
              id: 'call_1',
              name: 'ask-human',
              args: { question: 'First question' },
            }],
          })
          .mockResolvedValueOnce({
            content: JSON.stringify({
              targetAgent: 'hr',
              reasoning: 'Got enough info',
              confidence: 0.9,
            }),
            tool_calls: [],
          }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
      };

      await llmBasedRouting.route(mockState, config);

      // Check that second call includes conversation history
      const secondCallArgs = mockModel.invoke.mock.calls[1][0];
      expect(secondCallArgs.length).toBeGreaterThan(2); // System + User + AI + Tool messages
    });
  });

  describe('Error Handling', () => {
    it('should handle tool execution failures gracefully', async () => {
      const mockTool = toolBuilder()
        .name('failing-tool')
        .description('A tool that fails')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Input to the tool'),
        }))
        .implement(async ({ input }) => {
          throw new Error('Tool execution failed');
        })
        .build();

      const mockModel = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            tool_calls: [{
              id: 'call_fail',
              name: 'failing-tool',
              args: { input: 'test' },
            }],
          })
          .mockResolvedValueOnce({
            content: JSON.stringify({
              targetAgent: 'hr',
              reasoning: 'Fallback routing',
              confidence: 0.5,
            }),
            tool_calls: [],
          }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(decision.targetAgent).toBe('hr');
      // Should have retried after tool failure
      expect(mockModel.invoke).toHaveBeenCalledTimes(2);
    });

    it('should handle missing tool errors', async () => {
      const mockTool = toolBuilder()
        .name('existing-tool')
        .description('A tool that exists')
        .category(ToolCategory.UTILITY)
        .schema(z.object({
          input: z.string().describe('Input to the tool'),
        }))
        .implement(async ({ input }) => {
          return 'Success';
        })
        .build();

      const mockModel = {
        invoke: vi.fn()
          .mockResolvedValueOnce({
            content: '',
            tool_calls: [{
              id: 'call_missing',
              name: 'non-existent-tool',
              args: { input: 'test' },
            }],
          })
          .mockResolvedValueOnce({
            content: JSON.stringify({
              targetAgent: 'hr',
              reasoning: 'Routing despite tool error',
              confidence: 0.6,
            }),
            tool_calls: [],
          }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [mockTool],
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(decision.targetAgent).toBe('hr');
      expect(mockModel.invoke).toHaveBeenCalledTimes(2);
    });

    it('should throw error when LLM requests tools but none configured', async () => {
      const mockModel = {
        invoke: vi.fn().mockResolvedValue({
          content: '',
          tool_calls: [{
            id: 'call_1',
            name: 'some-tool',
            args: {},
          }],
        }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        // No tools configured
      };

      await expect(llmBasedRouting.route(mockState, config))
        .rejects.toThrow('LLM requested tool calls but no tools are configured');
    });

    it('should handle malformed JSON in routing decision', async () => {
      const mockModel = {
        invoke: vi.fn().mockResolvedValue({
          content: 'This is not valid JSON',
          tool_calls: [],
        }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
      };

      await expect(llmBasedRouting.route(mockState, config))
        .rejects.toThrow('Failed to parse routing decision from LLM');
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without tools configured', async () => {
      const mockModel = {
        invoke: vi.fn().mockResolvedValue({
          content: JSON.stringify({
            targetAgent: 'hr',
            reasoning: 'Standard routing without tools',
            confidence: 0.85,
          }),
          tool_calls: [],
        }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        // No tools configured
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(decision.targetAgent).toBe('hr');
      expect(decision.reasoning).toBe('Standard routing without tools');
      expect(decision.confidence).toBe(0.85);
      expect(mockModel.invoke).toHaveBeenCalledTimes(1);
    });

    it('should work with empty tools array', async () => {
      const mockModel = {
        invoke: vi.fn().mockResolvedValue({
          content: JSON.stringify({
            targetAgent: 'security',
            reasoning: 'Routing with empty tools array',
            confidence: 0.9,
          }),
          tool_calls: [],
        }),
      };

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: mockModel as any,
        tools: [],
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(decision.targetAgent).toBe('security');
      expect(mockModel.invoke).toHaveBeenCalledTimes(1);
    });
  });
});
