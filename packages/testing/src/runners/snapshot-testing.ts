import type { BaseMessage } from '@langchain/core/messages';
import { isDeepStrictEqual } from 'node:util';
import { expect } from 'vitest';

export type SnapshotObject = Record<string, unknown>;

export interface SnapshotDiff {
  added: SnapshotObject;
  removed: SnapshotObject;
  changed: Record<string, { from: unknown; to: unknown }>;
}

export interface MessageSnapshot {
  type: string;
  content: BaseMessage['content'];
}

export const ROOT_SNAPSHOT_DIFF_KEY = '$root';

/**
 * Snapshot configuration
 */
export interface SnapshotConfig {
  /**
   * Fields to include in snapshot
   */
  includeFields?: string[];
  
  /**
   * Fields to exclude from snapshot
   */
  excludeFields?: string[];
  
  /**
   * Whether to normalize timestamps
   */
  normalizeTimestamps?: boolean;
  
  /**
   * Whether to normalize IDs
   */
  normalizeIds?: boolean;
  
  /**
   * Custom normalizer function
   */
  normalizer?: (value: unknown) => unknown;
}

/**
 * Normalize a value for snapshot testing
 */
function normalizeValue(value: unknown, config: SnapshotConfig): unknown {
  const valueToNormalize = config.normalizer ? config.normalizer(value) : value;

  if (valueToNormalize === null || valueToNormalize === undefined) {
    return valueToNormalize;
  }
  
  // Normalize timestamps
  if (config.normalizeTimestamps && valueToNormalize instanceof Date) {
    return '[TIMESTAMP]';
  }
  
  if (config.normalizeTimestamps && typeof valueToNormalize === 'string') {
    // ISO timestamp pattern
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(valueToNormalize)) {
      return '[TIMESTAMP]';
    }
  }
  
  // Normalize IDs
  if (config.normalizeIds && typeof valueToNormalize === 'string') {
    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valueToNormalize)) {
      return '[UUID]';
    }
  }
  
  // Recursively normalize objects
  if (typeof valueToNormalize === 'object' && !Array.isArray(valueToNormalize)) {
    const normalized = Object.create(null) as SnapshotObject;
    
    for (const [key, val] of Object.entries(valueToNormalize)) {
      // Skip excluded fields
      if (config.excludeFields?.includes(key)) {
        continue;
      }
      
      // Include only specified fields if configured
      if (config.includeFields && !config.includeFields.includes(key)) {
        continue;
      }
      
      normalized[key] = normalizeValue(val, config);
    }
    
    return normalized;
  }
  
  // Recursively normalize arrays
  if (Array.isArray(valueToNormalize)) {
    return valueToNormalize.map((item) => normalizeValue(item, config));
  }
  
  return valueToNormalize;
}

function isSnapshotObject(value: unknown): value is SnapshotObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Create a snapshot of state
 */
export function createSnapshot<TState = unknown>(
  state: TState,
  config: SnapshotConfig = {}
): unknown {
  return normalizeValue(state, {
    normalizeTimestamps: true,
    normalizeIds: true,
    ...config,
  });
}

/**
 * Assert that state matches snapshot
 */
export function assertMatchesSnapshot<TState = unknown>(
  state: TState,
  config?: SnapshotConfig
): void {
  const snapshot = createSnapshot(state, config);
  expect(snapshot).toMatchSnapshot();
}

/**
 * Create a snapshot of messages
 */
export function createMessageSnapshot(
  messages: BaseMessage[],
  config?: SnapshotConfig
): MessageSnapshot[] {
  return messages.map((msg) => ({
    type: msg._getType(),
    content: normalizeValue(msg.content, {
      normalizeTimestamps: true,
      normalizeIds: true,
      ...config,
    }) as BaseMessage['content'],
  }));
}

/**
 * Assert that messages match snapshot
 */
export function assertMessagesMatchSnapshot(messages: BaseMessage[], config?: SnapshotConfig): void {
  const snapshot = createMessageSnapshot(messages, config);
  expect(snapshot).toMatchSnapshot();
}

/**
 * Compare two states for equality
 */
export function compareStates<TState1 = unknown, TState2 = unknown>(
  state1: TState1,
  state2: TState2,
  config?: SnapshotConfig
): boolean {
  const snapshot1 = createSnapshot(state1, config);
  const snapshot2 = createSnapshot(state2, config);
  
  return isDeepStrictEqual(snapshot1, snapshot2);
}

/**
 * Create a diff between two states
 */
export function createStateDiff<TState1 = unknown, TState2 = unknown>(
  state1: TState1,
  state2: TState2,
  config?: SnapshotConfig
): SnapshotDiff {
  const snapshot1 = createSnapshot(state1, config);
  const snapshot2 = createSnapshot(state2, config);
  
  const diff: SnapshotDiff = {
    added: {},
    removed: {},
    changed: {},
  };

  if (!isSnapshotObject(snapshot1) || !isSnapshotObject(snapshot2)) {
    if (!isDeepStrictEqual(snapshot1, snapshot2)) {
      diff.changed[ROOT_SNAPSHOT_DIFF_KEY] = { from: snapshot1, to: snapshot2 };
    }

    return diff;
  }
  
  // Find added and changed fields
  for (const [key, value] of Object.entries(snapshot2)) {
    if (!Object.hasOwn(snapshot1, key)) {
      diff.added[key] = value;
    } else if (!isDeepStrictEqual(snapshot1[key], value)) {
      diff.changed[key] = { from: snapshot1[key], to: value };
    }
  }
  
  // Find removed fields
  for (const key of Object.keys(snapshot1)) {
    if (!Object.hasOwn(snapshot2, key)) {
      diff.removed[key] = snapshot1[key];
    }
  }
  
  return diff;
}

/**
 * Assert that state has changed
 */
export function assertStateChanged<TStateBefore = unknown, TStateAfter = unknown>(
  stateBefore: TStateBefore,
  stateAfter: TStateAfter,
  expectedChanges: string[],
  config?: SnapshotConfig
): void {
  const diff = createStateDiff(stateBefore, stateAfter, config);
  
  expectedChanges.forEach((field) => {
    expect(diff.changed).toHaveProperty(field);
  });
}
