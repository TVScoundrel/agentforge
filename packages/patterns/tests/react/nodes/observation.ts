import { describe, expect, it } from 'vitest';
import { createObservationNode } from '../../../src/react/nodes.js';
import { createBaseState } from './helpers.js';

describe('ReAct Nodes: observation', () => {
  it('processes observations and updates scratchpad', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        thoughts: [{ content: 'I should use the test tool' }],
        actions: [
          {
            id: 'call_123',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_123',
            result: 'Result: hello',
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.scratchpad).toHaveLength(1);
    expect(result.scratchpad?.[0].step).toBe(1);
    expect(result.scratchpad?.[0].thought).toContain('test tool');
    expect(result.scratchpad?.[0].observation).toContain('Result: hello');
  });

  it('adds observation messages', async () => {
    const observationNode = createObservationNode(false);

    const result = await observationNode(
      createBaseState({
        actions: [
          {
            id: 'call_123',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_123',
            result: 'Success',
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.messages).toHaveLength(1);
    expect(result.messages?.[0].role).toBe('tool');
    expect(result.messages?.[0].content).toBe('Success');
    expect(result.messages?.[0].tool_call_id).toBe('call_123');
    expect(result.messages?.[0].name).toBe('test-tool');
  });

  it('handles error observations', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        actions: [
          {
            id: 'call_456',
            name: 'error-tool',
            arguments: {},
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_456',
            result: null,
            error: 'Tool failed',
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.scratchpad?.[0].observation).toContain('Error: Tool failed');
    expect(result.messages?.[0].content).toContain('Error: Tool failed');
  });

  it('stringifies structured observations and preserves tool names', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        thoughts: [{ content: 'Inspect the structured result' }],
        actions: [
          {
            id: 'call_json',
            name: 'test-tool',
            arguments: { input: 'json' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_json',
            result: { ok: true, count: 2 },
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.messages?.[0].name).toBe('test-tool');
    expect(result.messages?.[0].content).toContain('"ok": true');
    expect(result.scratchpad?.[0].observation).toContain('"count":2');
  });

  it('preserves undefined observation results as strings in messages and scratchpad', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        thoughts: [{ content: 'Inspect missing tool output' }],
        actions: [
          {
            id: 'call_undefined',
            name: 'test-tool',
            arguments: { input: 'undefined' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_undefined',
            result: undefined,
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.messages?.[0].content).toBe('undefined');
    expect(result.scratchpad?.[0].observation).toContain('undefined');
  });

  it('falls back to String(result) when JSON serialization throws', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        thoughts: [{ content: 'Inspect bigint output' }],
        actions: [
          {
            id: 'call_bigint',
            name: 'test-tool',
            arguments: { input: 'bigint' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_bigint',
            result: 1n,
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.messages?.[0].content).toBe('1');
    expect(result.scratchpad?.[0].observation).toContain('1');
  });

  it('stringifies action arguments safely when scratchpad formatting sees bigint input', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        thoughts: [{ content: 'Inspect bigint action input' }],
        actions: [
          {
            id: 'call_bigint_args',
            name: 'bigint-tool',
            arguments: { input: 1n },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_bigint_args',
            result: 'BigInt: 1',
            timestamp: Date.now(),
          },
        ],
        iteration: 1,
      })
    );

    expect(result.scratchpad?.[0].action).toContain('bigint-tool');
    expect(result.scratchpad?.[0].action).toContain('[object Object]');
  });

  it('defaults scratchpad step to 0 when iteration is unset', async () => {
    const observationNode = createObservationNode(false, true);

    const result = await observationNode(
      createBaseState({
        thoughts: [{ content: 'Recover missing iteration' }],
        actions: [
          {
            id: 'call_missing_iteration',
            name: 'test-tool',
            arguments: { input: 'hello' },
            timestamp: Date.now(),
          },
        ],
        observations: [
          {
            toolCallId: 'call_missing_iteration',
            result: 'Result: hello',
            timestamp: Date.now(),
          },
        ],
        iteration: undefined,
      })
    );

    expect(result.scratchpad?.[0].step).toBe(0);
  });
});
