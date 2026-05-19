import { describe, expect, it, vi } from 'vitest';
import { llmBasedRouting, logger } from '../../src/multi-agent/routing.js';
import { RoutingDecisionSchema } from '../../src/multi-agent/schemas.js';
import type { SupervisorConfig } from '../../src/multi-agent/types.js';
import { createMockRoutingState } from './routing.fixtures.js';

describe('Multi-Agent LLM-Based Routing', () => {
  it('should throw error if no model provided', async () => {
    const config: SupervisorConfig = {
      strategy: 'llm-based',
    };

    await expect(llmBasedRouting.route(createMockRoutingState(), config))
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

    const decision = await llmBasedRouting.route(createMockRoutingState(), config);

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

    const decision = await llmBasedRouting.route(createMockRoutingState(), config);

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

    const decision = await llmBasedRouting.route(createMockRoutingState(), config);

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

    const decision = await llmBasedRouting.route(createMockRoutingState(), config);

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

    const decision = await llmBasedRouting.route(createMockRoutingState(), config);

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

    await expect(llmBasedRouting.route(createMockRoutingState(), config)).rejects.toThrow(
      /Invalid LLM routing decision:/
    );
  });

  it('should surface structured invocation failures instead of retrying unstructured routing', async () => {
    const structuredInvoke = vi.fn().mockRejectedValue(new Error('Structured output unsupported'));

    const config: SupervisorConfig = {
      strategy: 'llm-based',
      model: {
        invoke: vi.fn(),
        withStructuredOutput: vi.fn().mockReturnValue({
          invoke: structuredInvoke,
        }),
      } as unknown as NonNullable<SupervisorConfig['model']>,
    };

    await expect(llmBasedRouting.route(createMockRoutingState(), config)).rejects.toThrow(
      'Structured output unsupported'
    );
    expect(structuredInvoke).toHaveBeenCalledOnce();
    expect(config.model?.invoke).not.toHaveBeenCalled();
  });

  it('should fall back to direct invocation when withStructuredOutput setup throws', async () => {
    const invoke = vi.fn().mockResolvedValue({
      targetAgent: 'writer',
      targetAgents: null,
      reasoning: 'Fallback after structured setup failure',
      confidence: 0.72,
    });
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);

    const config: SupervisorConfig = {
      strategy: 'llm-based',
      model: {
        invoke,
        withStructuredOutput: vi.fn().mockImplementation(() => {
          throw new Error('Structured output setup unsupported');
        }),
      } as unknown as NonNullable<SupervisorConfig['model']>,
    };

    const decision = await llmBasedRouting.route(createMockRoutingState(), config);

    expect(invoke).toHaveBeenCalledOnce();
    expect(warnSpy).toHaveBeenCalledWith(
      'Structured output unavailable, using direct routing fallback',
      expect.objectContaining({
        strategy: 'llm-based',
        fallback: 'direct-model-invoke',
        error: 'Structured output setup unsupported',
      })
    );
    expect(decision.targetAgent).toBe('writer');
    expect(decision.targetAgents).toBeNull();
    expect(decision.reasoning).toBe('Fallback after structured setup failure');
    expect(decision.confidence).toBe(0.72);
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

    await expect(llmBasedRouting.route(createMockRoutingState(), config)).rejects.toThrow(
      /Invalid LLM routing decision:/
    );
    expect(structuredInvoke).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalled();
  });
});
