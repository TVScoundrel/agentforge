import {
  AIMessage,
  BaseMessage,
  HumanMessage,
} from '@langchain/core/messages';
import { expect } from 'vitest';

type MessageType = 'human' | 'ai' | 'system' | 'tool';

type ToolCall<TArgs = unknown> = {
  name: string;
  args: TArgs;
};

type MessageLike<TType extends string = string> = {
  content: unknown;
  _getType: () => TType;
};

export type AssertedMessage<TType extends string = string> =
  | BaseMessage
  | MessageLike<TType>;

function isMessageLike(value: unknown): value is MessageLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<MessageLike>;
  return 'content' in candidate && typeof candidate._getType === 'function';
}

/**
 * Assert that a value is a message of a specific type
 */
export function assertIsMessage(value: unknown): asserts value is AssertedMessage;
export function assertIsMessage(value: unknown, type: 'human'): asserts value is AssertedMessage<'human'>;
export function assertIsMessage(value: unknown, type: 'ai'): asserts value is AssertedMessage<'ai'>;
export function assertIsMessage(value: unknown, type: 'system'): asserts value is AssertedMessage<'system'>;
export function assertIsMessage(value: unknown, type: 'tool'): asserts value is AssertedMessage<'tool'>;
export function assertIsMessage(
  value: unknown,
  type?: MessageType,
): asserts value is AssertedMessage {
  expect(value).toBeDefined();
  expect(value).not.toBeNull();
  expect(typeof value).toBe('object');

  const samePackageMessage = value instanceof BaseMessage;
  const structuralMessage = isMessageLike(value);

  expect(samePackageMessage || structuralMessage).toBe(true);

  const message = value as AssertedMessage;
  const messageType = message._getType();

  expect(typeof messageType).toBe('string');

  if (type) {
    expect(messageType).toBe(type);
  }
}

/**
 * Assert that messages array contains a message with specific content
 */
export function assertMessageContains(messages: BaseMessage[], content: string): void {
  const found = messages.some((msg) => 
    typeof msg.content === 'string' && msg.content.includes(content)
  );
  expect(found).toBe(true);
}

/**
 * Assert that the last message contains specific content
 */
export function assertLastMessageContains(messages: BaseMessage[], content: string): void {
  expect(messages.length).toBeGreaterThan(0);
  const lastMessage = messages[messages.length - 1];
  expect(lastMessage.content).toContain(content);
}

/**
 * Assert that state has required fields
 */
export function assertStateHasFields<TState extends object>(
  state: TState,
  fields: ReadonlyArray<keyof TState & (string | number)>
): void {
  fields.forEach((field) => {
    expect(state).toHaveProperty(typeof field === 'number' ? [field] : field);
  });
}

/**
 * Assert that a tool was called with specific arguments
 */
export function assertToolCalled(
  toolCalls: ReadonlyArray<ToolCall>,
  toolName: string,
): void;
export function assertToolCalled<TArgs extends Record<string, unknown>>(
  toolCalls: ReadonlyArray<ToolCall<TArgs>>,
  toolName: string,
  args: Partial<TArgs>,
): void;
export function assertToolCalled<TArgs>(
  toolCalls: ReadonlyArray<ToolCall<TArgs>>,
  toolName: string,
  args?: Partial<Extract<TArgs, Record<string, unknown>>>,
): void {
  const call = toolCalls.find((tc) => tc.name === toolName);
  expect(call).toBeDefined();

  if (args) {
    expect(call?.args).toMatchObject(args);
  }
}

/**
 * Assert that execution completed within time limit
 */
export async function assertCompletesWithin(
  fn: () => Promise<unknown>,
  maxMs: number
): Promise<void> {
  const start = Date.now();
  await fn();
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(maxMs);
}

/**
 * Assert that a function throws an error with specific message
 */
export async function assertThrowsWithMessage(
  fn: () => Promise<unknown>,
  message: string
): Promise<void> {
  await expect(fn()).rejects.toThrow(message);
}

/**
 * Assert that state matches a snapshot
 */
export function assertStateSnapshot<TState extends object>(
  state: TState,
  snapshot: Partial<TState>,
): void {
  expect(state).toMatchObject(snapshot);
}

/**
 * Assert that messages have alternating types (human, ai, human, ai, ...)
 */
export function assertAlternatingMessages(messages: BaseMessage[]): void {
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    
    if (current instanceof HumanMessage) {
      expect(next).toBeInstanceOf(AIMessage);
    } else if (current instanceof AIMessage) {
      expect(next).toBeInstanceOf(HumanMessage);
    }
  }
}

/**
 * Assert that an array is not empty
 */
export function assertNotEmpty<T>(array: readonly T[]): void {
  expect(array.length).toBeGreaterThan(0);
}

/**
 * Assert that a value is within a range
 */
export function assertInRange(value: number, min: number, max: number): void {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that agent iterations are within limit
 */
export function assertIterationsWithinLimit(iterations: number, maxIterations: number): void {
  expect(iterations).toBeLessThanOrEqual(maxIterations);
  expect(iterations).toBeGreaterThan(0);
}

/**
 * Assert that a result contains expected keys
 */
export function assertHasKeys<TObject extends object>(
  obj: TObject,
  keys: ReadonlyArray<keyof TObject & string>
): void {
  keys.forEach((key) => {
    expect(obj).toHaveProperty(key);
  });
}
