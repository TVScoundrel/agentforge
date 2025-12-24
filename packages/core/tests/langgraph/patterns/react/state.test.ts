import { describe, it, expect } from 'vitest';
import { StateGraph } from '@langchain/langgraph';
import {
  ReActState,
  ReActStateConfig,
  type ReActStateType,
  MessageSchema,
  ThoughtSchema,
  ToolCallSchema,
  ToolResultSchema,
  ScratchpadEntrySchema,
} from '../../../../src/langgraph/patterns/react/index.js';
import { validateState } from '../../../../src/langgraph/state.js';

describe('ReAct State Definition', () => {
  it('should create a valid LangGraph annotation', () => {
    expect(ReActState).toBeDefined();
    expect(ReActState.spec).toBeDefined();
    
    // Check that all state channels are defined
    expect(ReActState.spec.messages).toBeDefined();
    expect(ReActState.spec.thoughts).toBeDefined();
    expect(ReActState.spec.actions).toBeDefined();
    expect(ReActState.spec.observations).toBeDefined();
    expect(ReActState.spec.scratchpad).toBeDefined();
    expect(ReActState.spec.iteration).toBeDefined();
    expect(ReActState.spec.shouldContinue).toBeDefined();
    expect(ReActState.spec.response).toBeDefined();
  });

  it('should work with LangGraph StateGraph', () => {
    // This tests that our state annotation is compatible with LangGraph
    const testNode = (state: ReActStateType) => ({
      messages: [{ role: 'assistant' as const, content: 'test' }],
      iteration: 1,
    });

    const workflow = new StateGraph(ReActState)
      .addNode('test', testNode)
      .addEdge('__start__', 'test')
      .addEdge('test', '__end__')
      .compile();

    expect(workflow).toBeDefined();
  });

  it('should validate state with Zod schemas', () => {
    const validState = {
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
      thoughts: [
        { content: 'I should greet the user' },
      ],
      actions: [
        { id: '1', name: 'search', arguments: { query: 'test' } },
      ],
      observations: [
        { toolCallId: '1', result: 'search results' },
      ],
      scratchpad: [
        { step: 1, thought: 'thinking', action: 'searching', observation: 'found results' },
      ],
      iteration: 1,
      shouldContinue: true,
      response: undefined,
    };

    expect(() => validateState(validState, ReActStateConfig)).not.toThrow();
  });

  it('should reject invalid state with Zod schemas', () => {
    const invalidState = {
      messages: [
        { role: 'invalid_role', content: 'Hello' }, // Invalid role
      ],
      thoughts: [],
      actions: [],
      observations: [],
      scratchpad: [],
      iteration: 1,
    };

    expect(() => validateState(invalidState, ReActStateConfig)).toThrow();
  });

  it('should use reducers to accumulate state updates', () => {
    const initialState: ReActStateType = {
      messages: [{ role: 'user', content: 'Hello' }],
      thoughts: [{ content: 'First thought' }],
      actions: [],
      observations: [],
      scratchpad: [],
      iteration: 1,
      shouldContinue: true,
      response: undefined,
    };

    const update = {
      messages: [{ role: 'assistant' as const, content: 'Hi!' }],
      thoughts: [{ content: 'Second thought' }],
      iteration: 1,
    };

    // Manually apply reducers (in real usage, LangGraph does this)
    const merged = {
      ...initialState,
      messages: ReActStateConfig.messages.reducer!(
        initialState.messages,
        update.messages
      ),
      thoughts: ReActStateConfig.thoughts.reducer!(
        initialState.thoughts,
        update.thoughts
      ),
      iteration: ReActStateConfig.iteration.reducer!(
        initialState.iteration,
        update.iteration
      ),
    };

    expect(merged.messages).toHaveLength(2);
    expect(merged.thoughts).toHaveLength(2);
    expect(merged.iteration).toBe(2);
  });
});

describe('ReAct Schemas', () => {
  it('should validate Message schema', () => {
    const validMessage = {
      role: 'user',
      content: 'Hello world',
    };

    expect(() => MessageSchema.parse(validMessage)).not.toThrow();
  });

  it('should validate Thought schema', () => {
    const validThought = {
      content: 'I need to search for information',
      timestamp: Date.now(),
    };

    expect(() => ThoughtSchema.parse(validThought)).not.toThrow();
  });

  it('should validate ToolCall schema', () => {
    const validToolCall = {
      id: 'call_123',
      name: 'search',
      arguments: { query: 'test' },
    };

    expect(() => ToolCallSchema.parse(validToolCall)).not.toThrow();
  });

  it('should validate ToolResult schema', () => {
    const validResult = {
      toolCallId: 'call_123',
      result: { data: 'some data' },
    };

    expect(() => ToolResultSchema.parse(validResult)).not.toThrow();
  });

  it('should validate ScratchpadEntry schema', () => {
    const validEntry = {
      step: 1,
      thought: 'Thinking about the problem',
      action: 'Calling search tool',
      observation: 'Found relevant results',
    };

    expect(() => ScratchpadEntrySchema.parse(validEntry)).not.toThrow();
  });
});

