/**
 * Checkpointer Utility Functions
 *
 * Provides utility functions for working with LangGraph checkpointers.
 *
 * @module langgraph/persistence/utils
 */

import type { BaseCheckpointSaver, CheckpointTuple } from '@langchain/langgraph';
import type { RunnableConfig } from '@langchain/core/runnables';

/**
 * Options for getting checkpoint history
 */
export interface CheckpointHistoryOptions {
  /**
   * Thread ID to get history for
   */
  threadId: string;

  /**
   * Maximum number of checkpoints to return
   * @default 10
   */
  limit?: number;

  /**
   * Get checkpoints before this checkpoint ID
   */
  before?: string;
}

/**
 * Get the checkpoint history for a thread.
 *
 * Returns a list of checkpoints for the specified thread, ordered from
 * most recent to oldest.
 *
 * @example
 * ```typescript
 * import { getCheckpointHistory } from '@agentforge/core';
 *
 * const history = await getCheckpointHistory(checkpointer, {
 *   threadId: 'conversation-1',
 *   limit: 10,
 * });
 *
 * for (const checkpoint of history) {
 *   console.log(checkpoint.checkpoint.id);
 * }
 * ```
 *
 * @param checkpointer - The checkpointer to query
 * @param options - History query options
 * @returns A promise that resolves to an array of checkpoint tuples
 */
export async function getCheckpointHistory(
  checkpointer: BaseCheckpointSaver,
  options: CheckpointHistoryOptions
): Promise<CheckpointTuple[]> {
  const { threadId, limit = 10, before } = options;

  const config: RunnableConfig = {
    configurable: {
      thread_id: threadId,
    },
  };

  if (before) {
    config.configurable!.checkpoint_id = before;
  }

  const checkpoints: CheckpointTuple[] = [];

  // Use the list method to get checkpoints
  for await (const checkpoint of checkpointer.list(config, { limit })) {
    checkpoints.push(checkpoint);
  }

  return checkpoints;
}

/**
 * Get the latest checkpoint for a thread.
 *
 * Returns the most recent checkpoint for the specified thread, or null
 * if no checkpoints exist.
 *
 * @example
 * ```typescript
 * import { getLatestCheckpoint } from '@agentforge/core';
 *
 * const latest = await getLatestCheckpoint(checkpointer, {
 *   threadId: 'conversation-1',
 * });
 *
 * if (latest) {
 *   console.log('Latest checkpoint:', latest.checkpoint.id);
 * }
 * ```
 *
 * @param checkpointer - The checkpointer to query
 * @param options - Query options
 * @returns A promise that resolves to the latest checkpoint tuple or null
 */
export async function getLatestCheckpoint(
  checkpointer: BaseCheckpointSaver,
  options: { threadId: string }
): Promise<CheckpointTuple | null> {
  const { threadId } = options;

  const config: RunnableConfig = {
    configurable: {
      thread_id: threadId,
    },
  };

  // Get the checkpoint tuple
  const tuple = await checkpointer.getTuple(config);

  return tuple || null;
}

/**
 * Clear all checkpoints for a thread.
 *
 * Note: This functionality depends on the checkpointer implementation.
 * Not all checkpointers support deletion.
 *
 * @example
 * ```typescript
 * import { clearThread } from '@agentforge/core';
 *
 * await clearThread(checkpointer, {
 *   threadId: 'conversation-1',
 * });
 * ```
 *
 * @param checkpointer - The checkpointer to modify
 * @param options - Clear options
 * @returns A promise that resolves when the thread is cleared
 * @throws Error if the checkpointer doesn't support deletion
 */
export async function clearThread(
  checkpointer: BaseCheckpointSaver,
  options: { threadId: string }
): Promise<void> {
  const { threadId } = options;

  // Get all checkpoints for the thread
  const checkpoints = await getCheckpointHistory(checkpointer, {
    threadId,
    limit: 1000, // Get all checkpoints
  });

  // Note: BaseCheckpointSaver doesn't have a delete method in the interface
  // This is a limitation of the current LangGraph API
  // For now, we'll throw an error with a helpful message
  if (checkpoints.length > 0) {
    throw new Error(
      'Clearing threads is not supported by the current checkpointer implementation. ' +
        'Consider using a new thread ID instead.'
    );
  }
}

