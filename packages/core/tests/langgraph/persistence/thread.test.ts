import { describe, it, expect } from 'vitest';
import {
  generateThreadId,
  createThreadConfig,
  createConversationConfig,
} from '../../../src/langgraph/persistence/thread.js';

describe('Thread Management', () => {
  describe('generateThreadId', () => {
    it('should generate unique random thread IDs', () => {
      const id1 = generateThreadId();
      const id2 = generateThreadId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate deterministic IDs from seed', () => {
      const id1 = generateThreadId('user-123');
      const id2 = generateThreadId('user-123');
      const id3 = generateThreadId('user-456');

      expect(id1).toBe(id2); // Same seed = same ID
      expect(id1).not.toBe(id3); // Different seed = different ID
      expect(id1).toMatch(/^thread-/); // Should have prefix
    });

    it('should handle empty seed as random', () => {
      const id1 = generateThreadId('');
      const id2 = generateThreadId('');

      // Empty seed should generate random IDs
      expect(id1).not.toBe(id2);
    });
  });

  describe('createThreadConfig', () => {
    it('should create config with thread ID', () => {
      const config = createThreadConfig({
        threadId: 'test-thread',
      });

      expect(config).toBeDefined();
      expect(config.configurable).toBeDefined();
      expect(config.configurable?.thread_id).toBe('test-thread');
    });

    it('should generate thread ID if not provided', () => {
      const config = createThreadConfig();

      expect(config.configurable).toBeDefined();
      expect(config.configurable?.thread_id).toBeDefined();
      expect(typeof config.configurable?.thread_id).toBe('string');
    });

    it('should include checkpoint ID when provided', () => {
      const config = createThreadConfig({
        threadId: 'test-thread',
        checkpointId: 'checkpoint-123',
      });

      expect(config.configurable?.checkpoint_id).toBe('checkpoint-123');
    });

    it('should include checkpoint namespace when provided', () => {
      const config = createThreadConfig({
        threadId: 'test-thread',
        checkpointNamespace: 'my-namespace',
      });

      expect(config.configurable?.checkpoint_ns).toBe('my-namespace');
    });

    it('should include metadata when provided', () => {
      const metadata = { userId: 'user-123', sessionId: 'session-456' };
      const config = createThreadConfig({
        threadId: 'test-thread',
        metadata,
      });

      expect(config.metadata).toEqual(metadata);
    });

    it('should create config with all options', () => {
      const config = createThreadConfig({
        threadId: 'test-thread',
        checkpointId: 'checkpoint-123',
        checkpointNamespace: 'my-namespace',
        metadata: { key: 'value' },
      });

      expect(config.configurable?.thread_id).toBe('test-thread');
      expect(config.configurable?.checkpoint_id).toBe('checkpoint-123');
      expect(config.configurable?.checkpoint_ns).toBe('my-namespace');
      expect(config.metadata).toEqual({ key: 'value' });
    });
  });

  describe('createConversationConfig', () => {
    it('should create config with user ID', () => {
      const config = createConversationConfig({
        userId: 'user-123',
      });

      expect(config.configurable).toBeDefined();
      expect(config.configurable?.thread_id).toBeDefined();
      expect(config.metadata?.userId).toBe('user-123');
    });

    it('should create deterministic thread ID from user ID', () => {
      const config1 = createConversationConfig({ userId: 'user-123' });
      const config2 = createConversationConfig({ userId: 'user-123' });

      expect(config1.configurable?.thread_id).toBe(config2.configurable?.thread_id);
    });

    it('should include session ID in thread ID when provided', () => {
      const config1 = createConversationConfig({
        userId: 'user-123',
        sessionId: 'session-1',
      });
      const config2 = createConversationConfig({
        userId: 'user-123',
        sessionId: 'session-2',
      });

      expect(config1.configurable?.thread_id).not.toBe(config2.configurable?.thread_id);
      expect(config1.metadata?.sessionId).toBe('session-1');
      expect(config2.metadata?.sessionId).toBe('session-2');
    });

    it('should include additional metadata', () => {
      const config = createConversationConfig({
        userId: 'user-123',
        metadata: { custom: 'value' },
      });

      expect(config.metadata?.userId).toBe('user-123');
      expect(config.metadata?.custom).toBe('value');
    });

    it('should merge metadata with user and session info', () => {
      const config = createConversationConfig({
        userId: 'user-123',
        sessionId: 'session-456',
        metadata: { extra: 'data' },
      });

      expect(config.metadata).toEqual({
        userId: 'user-123',
        sessionId: 'session-456',
        extra: 'data',
      });
    });
  });
});

