import { BaseMessage } from '@langchain/core/messages';
import { expect } from 'vitest';

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
  normalizer?: (value: any) => any;
}

/**
 * Normalize a value for snapshot testing
 */
function normalizeValue(value: any, config: SnapshotConfig): any {
  if (value === null || value === undefined) {
    return value;
  }
  
  // Apply custom normalizer
  if (config.normalizer) {
    return config.normalizer(value);
  }
  
  // Normalize timestamps
  if (config.normalizeTimestamps && value instanceof Date) {
    return '[TIMESTAMP]';
  }
  
  if (config.normalizeTimestamps && typeof value === 'string') {
    // ISO timestamp pattern
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      return '[TIMESTAMP]';
    }
  }
  
  // Normalize IDs
  if (config.normalizeIds && typeof value === 'string') {
    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return '[UUID]';
    }
  }
  
  // Recursively normalize objects
  if (typeof value === 'object' && !Array.isArray(value)) {
    const normalized: any = {};
    
    for (const [key, val] of Object.entries(value)) {
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
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item, config));
  }
  
  return value;
}

/**
 * Create a snapshot of state
 */
export function createSnapshot(state: any, config: SnapshotConfig = {}): any {
  return normalizeValue(state, {
    normalizeTimestamps: true,
    normalizeIds: true,
    ...config,
  });
}

/**
 * Assert that state matches snapshot
 */
export function assertMatchesSnapshot(state: any, config?: SnapshotConfig): void {
  const snapshot = createSnapshot(state, config);
  expect(snapshot).toMatchSnapshot();
}

/**
 * Create a snapshot of messages
 */
export function createMessageSnapshot(messages: BaseMessage[], config?: SnapshotConfig): any {
  return messages.map((msg) => ({
    type: msg._getType(),
    content: msg.content,
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
export function compareStates(state1: any, state2: any, config?: SnapshotConfig): boolean {
  const snapshot1 = createSnapshot(state1, config);
  const snapshot2 = createSnapshot(state2, config);
  
  return JSON.stringify(snapshot1) === JSON.stringify(snapshot2);
}

/**
 * Create a diff between two states
 */
export function createStateDiff(state1: any, state2: any, config?: SnapshotConfig): any {
  const snapshot1 = createSnapshot(state1, config);
  const snapshot2 = createSnapshot(state2, config);
  
  const diff: any = {
    added: {},
    removed: {},
    changed: {},
  };
  
  // Find added and changed fields
  for (const [key, value] of Object.entries(snapshot2)) {
    if (!(key in snapshot1)) {
      diff.added[key] = value;
    } else if (JSON.stringify(snapshot1[key]) !== JSON.stringify(value)) {
      diff.changed[key] = { from: snapshot1[key], to: value };
    }
  }
  
  // Find removed fields
  for (const key of Object.keys(snapshot1)) {
    if (!(key in snapshot2)) {
      diff.removed[key] = snapshot1[key];
    }
  }
  
  return diff;
}

/**
 * Assert that state has changed
 */
export function assertStateChanged(
  stateBefore: any,
  stateAfter: any,
  expectedChanges: string[],
  config?: SnapshotConfig
): void {
  const diff = createStateDiff(stateBefore, stateAfter, config);
  
  expectedChanges.forEach((field) => {
    expect(diff.changed).toHaveProperty(field);
  });
}

