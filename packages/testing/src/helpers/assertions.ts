import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
import { expect } from 'vitest';

/**
 * Assert that a value is a message of a specific type
 */
export function assertIsMessage(value: any, type?: 'human' | 'ai' | 'system'): asserts value is BaseMessage {
  expect(value).toBeDefined();
  expect(value).toHaveProperty('content');
  
  if (type === 'human') {
    expect(value).toBeInstanceOf(HumanMessage);
  } else if (type === 'ai') {
    expect(value).toBeInstanceOf(AIMessage);
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
export function assertStateHasFields<T extends Record<string, any>>(
  state: T,
  fields: (keyof T)[]
): void {
  fields.forEach((field) => {
    expect(state).toHaveProperty(field as string);
  });
}

/**
 * Assert that a tool was called with specific arguments
 */
export function assertToolCalled(
  toolCalls: Array<{ name: string; args: any }>,
  toolName: string,
  args?: Record<string, any>
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
  fn: () => Promise<any>,
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
  fn: () => Promise<any>,
  message: string
): Promise<void> {
  await expect(fn()).rejects.toThrow(message);
}

/**
 * Assert that state matches a snapshot
 */
export function assertStateSnapshot(state: any, snapshot: any): void {
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
export function assertNotEmpty<T>(array: T[]): void {
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
export function assertHasKeys<T extends Record<string, any>>(
  obj: T,
  keys: string[]
): void {
  keys.forEach((key) => {
    expect(obj).toHaveProperty(key);
  });
}

