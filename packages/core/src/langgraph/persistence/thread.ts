/**
 * Thread Management Utilities
 *
 * Provides utilities for managing conversation threads and configurations.
 *
 * @module langgraph/persistence/thread
 */

import { randomUUID } from 'crypto';
import type { RunnableConfig } from '@langchain/core/runnables';

/**
 * Configuration for a thread
 */
export interface ThreadConfig {
  /**
   * Unique identifier for the thread
   */
  threadId: string;

  /**
   * Optional checkpoint ID to resume from
   */
  checkpointId?: string;

  /**
   * Optional checkpoint namespace
   */
  checkpointNamespace?: string;

  /**
   * Additional metadata for the thread
   */
  metadata?: Record<string, any>;
}

/**
 * Configuration for a conversation
 */
export interface ConversationConfig {
  /**
   * User ID for the conversation
   */
  userId: string;

  /**
   * Optional session ID
   */
  sessionId?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Generate a unique thread ID.
 *
 * If a seed is provided, generates a deterministic UUID v5 based on the seed.
 * Otherwise, generates a random UUID v4.
 *
 * @example
 * ```typescript
 * import { generateThreadId } from '@agentforge/core';
 *
 * // Random thread ID
 * const threadId = generateThreadId();
 *
 * // Deterministic thread ID from seed
 * const threadId2 = generateThreadId('user-123');
 * ```
 *
 * @param seed - Optional seed for deterministic ID generation
 * @returns A unique thread ID
 */
export function generateThreadId(seed?: string): string {
  if (seed && seed.length > 0) {
    // For deterministic IDs, we'll use a simple hash-based approach
    // In production, you might want to use UUID v5 with a proper namespace
    const hash = Buffer.from(seed).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    return `thread-${hash}`;
  }

  return randomUUID();
}

/**
 * Create a thread configuration for LangGraph.
 *
 * This creates a RunnableConfig object with the thread configuration
 * that can be passed to graph.invoke() or graph.stream().
 *
 * @example
 * ```typescript
 * import { createThreadConfig } from '@agentforge/core';
 *
 * const config = createThreadConfig({
 *   threadId: 'conversation-1',
 *   metadata: { userId: 'user-123' },
 * });
 *
 * const result = await app.invoke(input, config);
 * ```
 *
 * @param config - Thread configuration
 * @returns A RunnableConfig object
 */
export function createThreadConfig(config: Partial<ThreadConfig> = {}): RunnableConfig {
  const { threadId = generateThreadId(), checkpointId, checkpointNamespace, metadata } = config;

  const runnableConfig: RunnableConfig = {
    configurable: {
      thread_id: threadId,
    },
  };

  if (checkpointId) {
    runnableConfig.configurable!.checkpoint_id = checkpointId;
  }

  if (checkpointNamespace) {
    runnableConfig.configurable!.checkpoint_ns = checkpointNamespace;
  }

  if (metadata) {
    runnableConfig.metadata = metadata;
  }

  return runnableConfig;
}

/**
 * Create a conversation configuration for LangGraph.
 *
 * This is a convenience function that creates a thread configuration
 * with user and session information, commonly used for chat applications.
 *
 * @example
 * ```typescript
 * import { createConversationConfig } from '@agentforge/core';
 *
 * const config = createConversationConfig({
 *   userId: 'user-123',
 *   sessionId: 'session-456',
 * });
 *
 * const result = await app.invoke(input, config);
 * ```
 *
 * @param config - Conversation configuration
 * @returns A RunnableConfig object
 */
export function createConversationConfig(config: ConversationConfig): RunnableConfig {
  const { userId, sessionId, metadata = {} } = config;

  // Generate thread ID from user and session
  const threadId = sessionId
    ? generateThreadId(`${userId}-${sessionId}`)
    : generateThreadId(userId);

  return createThreadConfig({
    threadId,
    metadata: {
      ...metadata,
      userId,
      sessionId,
    },
  });
}

