/**
 * Tests for Multi-Agent Routing Strategies
 */

import { describe, it, expect, vi } from 'vitest';
import {
  llmBasedRouting,
  roundRobinRouting,
  skillBasedRouting,
  loadBalancedRouting,
  ruleBasedRouting,
  getRoutingStrategy,
  logger,
} from '../../src/multi-agent/routing.js';
import type { MultiAgentStateType } from '../../src/multi-agent/state.js';
import type { SupervisorConfig } from '../../src/multi-agent/types.js';
import { RoutingDecisionSchema } from '../../src/multi-agent/schemas.js';

describe('Multi-Agent Routing Strategies', () => {
  const mockState: MultiAgentStateType = {
    input: 'Test task requiring research and analysis',
    messages: [{
      from: 'user',
      to: ['supervisor'],
      type: 'user_input',
      content: 'Test task requiring research and analysis',
      timestamp: Date.now(),
    }],
    workers: {
      'researcher': {
        skills: ['research', 'analysis'],
        tools: ['search', 'scrape'],
        available: true,
        currentWorkload: 0,
      },
      'writer': {
        skills: ['writing', 'editing'],
        tools: ['format'],
        available: true,
        currentWorkload: 2,
      },
      'coder': {
        skills: ['coding', 'debugging'],
        tools: ['compiler', 'debugger'],
        available: true,
        currentWorkload: 1,
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

  describe('Round-Robin Routing', () => {
    it('should distribute tasks evenly across workers', async () => {
      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const decision1 = await roundRobinRouting.route(mockState, config);
      expect(decision1.targetAgent).toBe('researcher');
      expect(decision1.strategy).toBe('round-robin');
      expect(decision1.confidence).toBe(1.0);

      const state2 = {
        ...mockState,
        routingHistory: [decision1],
      };
      const decision2 = await roundRobinRouting.route(state2, config);
      expect(decision2.targetAgent).toBe('writer');

      const state3 = {
        ...mockState,
        routingHistory: [decision1, decision2],
      };
      const decision3 = await roundRobinRouting.route(state3, config);
      expect(decision3.targetAgent).toBe('coder');
    });

    it('should only route to available workers', async () => {
      const stateWithUnavailable: MultiAgentStateType = {
        ...mockState,
        workers: {
          'researcher': {
            skills: ['research'],
            tools: [],
            available: false,
            currentWorkload: 0,
          },
          'writer': {
            skills: ['writing'],
            tools: [],
            available: true,
            currentWorkload: 0,
          },
        },
      };

      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      const decision = await roundRobinRouting.route(stateWithUnavailable, config);
      expect(decision.targetAgent).toBe('writer');
    });

    it('should throw error if no workers available', async () => {
      const stateNoWorkers: MultiAgentStateType = {
        ...mockState,
        workers: {
          'researcher': {
            skills: ['research'],
            tools: [],
            available: false,
            currentWorkload: 0,
          },
        },
      };

      const config: SupervisorConfig = {
        strategy: 'round-robin',
      };

      await expect(roundRobinRouting.route(stateNoWorkers, config))
        .rejects.toThrow('No available workers');
    });
  });

  describe('Skill-Based Routing', () => {
    it('should route to worker with matching skills', async () => {
      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(mockState, config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.strategy).toBe('skill-based');
      expect(decision.reasoning).toContain('research');
    });

    it('should prioritize skills over tools', async () => {
      const stateWithToolMatch: MultiAgentStateType = {
        ...mockState,
        input: 'Use the compiler tool',
        messages: [{
          from: 'user',
          to: ['supervisor'],
          type: 'user_input',
          content: 'Use the compiler tool',
          timestamp: Date.now(),
        }],
      };

      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(stateWithToolMatch, config);
      expect(decision.targetAgent).toBe('coder');
    });

    it('should fallback to first available worker if no matches', async () => {
      const stateNoMatch: MultiAgentStateType = {
        ...mockState,
        input: 'Something completely unrelated',
        messages: [{
          from: 'user',
          to: ['supervisor'],
          type: 'user_input',
          content: 'Something completely unrelated',
          timestamp: Date.now(),
        }],
      };

      const config: SupervisorConfig = {
        strategy: 'skill-based',
      };

      const decision = await skillBasedRouting.route(stateNoMatch, config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.confidence).toBe(0.5);
      expect(decision.reasoning).toContain('No skill matches');
    });
  });

  describe('Load-Balanced Routing', () => {
    it('should route to worker with lowest workload', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      const decision = await loadBalancedRouting.route(mockState, config);
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.strategy).toBe('load-balanced');
      expect(decision.reasoning).toContain('Lowest workload: 0');
    });

    it('should have high confidence for zero workload', async () => {
      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      const decision = await loadBalancedRouting.route(mockState, config);
      expect(decision.confidence).toBe(1.0);
    });

    it('should throw error if no workers available', async () => {
      const stateNoWorkers: MultiAgentStateType = {
        ...mockState,
        workers: {},
      };

      const config: SupervisorConfig = {
        strategy: 'load-balanced',
      };

      await expect(loadBalancedRouting.route(stateNoWorkers, config))
        .rejects.toThrow('No available workers');
    });
  });

  describe('Rule-Based Routing', () => {
    it('should use custom routing function', async () => {
      const customRoutingFn = vi.fn().mockResolvedValue({
        targetAgent: 'writer',
        reasoning: 'Custom rule applied',
        confidence: 0.9,
        strategy: 'rule-based',
        timestamp: Date.now(),
      });

      const config: SupervisorConfig = {
        strategy: 'rule-based',
        routingFn: customRoutingFn,
      };

      const decision = await ruleBasedRouting.route(mockState, config);
      expect(customRoutingFn).toHaveBeenCalledWith(mockState);
      expect(decision.targetAgent).toBe('writer');
      expect(decision.reasoning).toBe('Custom rule applied');
    });

    it('should throw error if no routing function provided', async () => {
      const config: SupervisorConfig = {
        strategy: 'rule-based',
      };

      await expect(ruleBasedRouting.route(mockState, config))
        .rejects.toThrow('requires a custom routing function');
    });
  });

  describe('LLM-Based Routing', () => {
    it('should throw error if no model provided', async () => {
      const config: SupervisorConfig = {
        strategy: 'llm-based',
      };

      await expect(llmBasedRouting.route(mockState, config))
        .rejects.toThrow('requires a model');
    });

    it('should use structured output when available and preserve parallel targets', async () => {
      const structuredDecision = RoutingDecisionSchema.parse({
        targetAgent: null,
        targetAgents: ['researcher', 'writer'],
        reasoning: 'Parallel research and writing',
        confidence: 0.9,
        strategy: 'llm-based',
        timestamp: 123,
      });

      const structuredInvoke = vi.fn().mockResolvedValue(structuredDecision);
      const withStructuredOutput = vi.fn().mockReturnValue({
        invoke: structuredInvoke,
      });
      const invoke = vi.fn().mockResolvedValue('unstructured fallback should not be used');

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
          withStructuredOutput,
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(withStructuredOutput).toHaveBeenCalledWith(RoutingDecisionSchema);
      expect(structuredInvoke).toHaveBeenCalledOnce();
      expect(invoke).not.toHaveBeenCalled();
      expect(decision.targetAgents).toEqual(['researcher', 'writer']);
      expect(decision.targetAgent).toBeNull();
      expect(decision.reasoning).toBe('Parallel research and writing');
      expect(decision.strategy).toBe('llm-based');
    });

    it('should fall back to parsing direct model output when structured output is unavailable', async () => {
      const invoke = vi.fn().mockResolvedValue({
        targetAgent: 'researcher',
        targetAgents: null,
        reasoning: 'Fallback direct output',
        confidence: 0.7,
      });

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(invoke).toHaveBeenCalledOnce();
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.targetAgents).toBeNull();
      expect(decision.reasoning).toBe('Fallback direct output');
      expect(decision.confidence).toBe(0.7);
      expect(decision.strategy).toBe('llm-based');
    });

    it('should parse JSON returned in model content when structured output is unavailable', async () => {
      const invoke = vi.fn().mockResolvedValue({
        content: JSON.stringify({
          targetAgent: null,
          targetAgents: ['researcher', 'writer'],
          reasoning: 'Fallback JSON content',
          confidence: 0.85,
        }),
      });

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(invoke).toHaveBeenCalledOnce();
      expect(decision.targetAgent).toBeNull();
      expect(decision.targetAgents).toEqual(['researcher', 'writer']);
      expect(decision.reasoning).toBe('Fallback JSON content');
      expect(decision.confidence).toBe(0.85);
      expect(decision.strategy).toBe('llm-based');
    });


    it('should parse array-based text content when structured output is unavailable', async () => {
      const invoke = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              targetAgent: 'researcher',
              targetAgents: null,
              reasoning: 'Fallback array content',
              confidence: 0.65,
            }),
          },
        ],
      });

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(invoke).toHaveBeenCalledOnce();
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.targetAgents).toBeNull();
      expect(decision.reasoning).toBe('Fallback array content');
      expect(decision.confidence).toBe(0.65);
      expect(decision.strategy).toBe('llm-based');
    });

    it('should ignore non-text blocks when array content also contains a text routing decision', async () => {
      const invoke = vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              targetAgent: null,
              targetAgents: ['researcher', 'writer'],
              reasoning: 'Fallback mixed array content',
              confidence: 0.75,
            }),
          },
          {
            type: 'tool_use',
            name: 'ignored-tool',
            input: { note: 'non-text block should not break parsing' },
          },
        ],
      });

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      const decision = await llmBasedRouting.route(mockState, config);

      expect(invoke).toHaveBeenCalledOnce();
      expect(decision.targetAgent).toBeNull();
      expect(decision.targetAgents).toEqual(['researcher', 'writer']);
      expect(decision.reasoning).toBe('Fallback mixed array content');
      expect(decision.confidence).toBe(0.75);
      expect(decision.strategy).toBe('llm-based');
    });

    it('should surface routing-specific context for invalid fallback content', async () => {
      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke: vi.fn().mockResolvedValue({ content: '{invalid json' }),
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      await expect(llmBasedRouting.route(mockState, config)).rejects.toThrow(
        /Invalid LLM routing decision:/
      );
    });

    it('should fall back to direct invocation when structured output is exposed but unsupported', async () => {
      const structuredInvoke = vi.fn().mockRejectedValue(new Error('Structured output unsupported'));
      const invoke = vi.fn().mockResolvedValue({
        targetAgent: 'researcher',
        targetAgents: null,
        reasoning: 'Fallback after structured output failure',
        confidence: 0.8,
      });

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
          withStructuredOutput: vi.fn().mockReturnValue({
            invoke: structuredInvoke,
          }),
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
      const decision = await llmBasedRouting.route(mockState, config);

      expect(structuredInvoke).toHaveBeenCalledOnce();
      expect(invoke).toHaveBeenCalledOnce();
      expect(warnSpy).toHaveBeenCalledWith(
        'Structured output unavailable, using direct routing fallback',
        expect.objectContaining({
          strategy: 'llm-based',
          fallback: 'direct-model-invoke',
          error: 'Structured output unsupported',
        })
      );
      expect(decision.targetAgent).toBe('researcher');
      expect(decision.targetAgents).toBeNull();
      expect(decision.reasoning).toBe('Fallback after structured output failure');
      expect(decision.confidence).toBe(0.8);
      expect(decision.strategy).toBe('llm-based');
      warnSpy.mockRestore();
    });

    it('should not retry direct invocation when structured output returns an invalid decision', async () => {
      const structuredInvoke = vi.fn().mockResolvedValue({
        targetAgent: 123,
        targetAgents: null,
        reasoning: 'Invalid structured output',
        confidence: 0.8,
      });
      const invoke = vi.fn();

      const config: SupervisorConfig = {
        strategy: 'llm-based',
        model: {
          invoke,
          withStructuredOutput: vi.fn().mockReturnValue({
            invoke: structuredInvoke,
          }),
        } as unknown as NonNullable<SupervisorConfig['model']>,
      };

      await expect(llmBasedRouting.route(mockState, config)).rejects.toThrow(
        /Invalid LLM routing decision:/
      );
      expect(structuredInvoke).toHaveBeenCalledOnce();
      expect(invoke).not.toHaveBeenCalled();
    });
  });

  describe('getRoutingStrategy', () => {
    it('should return correct strategy implementation', () => {
      expect(getRoutingStrategy('round-robin')).toBe(roundRobinRouting);
      expect(getRoutingStrategy('skill-based')).toBe(skillBasedRouting);
      expect(getRoutingStrategy('load-balanced')).toBe(loadBalancedRouting);
      expect(getRoutingStrategy('rule-based')).toBe(ruleBasedRouting);
      expect(getRoutingStrategy('llm-based')).toBe(llmBasedRouting);
    });

    it('should throw error for unknown strategy', () => {
      expect(() => getRoutingStrategy('unknown'))
        .toThrow('Unknown routing strategy');
    });
  });
});
