/**
 * Checkpointer Factory Functions
 *
 * Provides factory functions for creating LangGraph checkpointers with sensible defaults.
 *
 * @module langgraph/persistence/checkpointer
 */

import { MemorySaver } from '@langchain/langgraph';
import type { BaseCheckpointSaver } from '@langchain/langgraph';

/**
 * Serializer protocol for checkpoint data
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SerializerProtocol {
  // Placeholder for serializer interface
  // LangGraph's actual interface may differ
}

/**
 * Common options for all checkpointers
 */
export interface CheckpointerOptions {
  /**
   * Custom serializer for checkpoint data
   * @default undefined (uses default serializer)
   */
  serializer?: SerializerProtocol;
}

/**
 * Options for SQLite checkpointer
 */
export interface SqliteCheckpointerOptions extends CheckpointerOptions {
  /**
   * Path to the SQLite database file
   * @default ':memory:' (in-memory database)
   */
  path?: string;

  /**
   * Whether to automatically run migrations
   * @default true
   */
  autoMigrate?: boolean;
}

/**
 * Create an in-memory checkpointer for development and testing.
 *
 * This checkpointer stores all checkpoints in memory and is lost when the process exits.
 * Ideal for development, testing, and experimentation.
 *
 * @example
 * ```typescript
 * import { createMemoryCheckpointer } from '@agentforge/core';
 *
 * const checkpointer = createMemoryCheckpointer();
 *
 * const app = workflow.compile({ checkpointer });
 * ```
 *
 * @param options - Optional checkpointer configuration
 * @returns A MemorySaver instance
 */
export function createMemoryCheckpointer(
  options?: CheckpointerOptions
): MemorySaver {
  return new MemorySaver();
}

/**
 * Create a SQLite-based checkpointer for local persistence.
 *
 * This checkpointer stores checkpoints in a SQLite database file, providing
 * persistence across process restarts. Ideal for local development and
 * single-machine deployments.
 *
 * Note: Requires `@langchain/langgraph-checkpoint-sqlite` to be installed.
 *
 * @example
 * ```typescript
 * import { createSqliteCheckpointer } from '@agentforge/core';
 *
 * // Use a file-based database
 * const checkpointer = await createSqliteCheckpointer({
 *   path: './checkpoints.db',
 *   autoMigrate: true,
 * });
 *
 * const app = workflow.compile({ checkpointer });
 * ```
 *
 * @param options - SQLite checkpointer configuration
 * @returns A Promise that resolves to a SqliteSaver instance
 * @throws Error if @langchain/langgraph-checkpoint-sqlite is not installed
 */
export async function createSqliteCheckpointer(
  options: SqliteCheckpointerOptions = {}
): Promise<BaseCheckpointSaver> {
  const { path = ':memory:', autoMigrate = true } = options;

  try {
    // Dynamically import the SQLite checkpointer
    // @ts-expect-error - Optional peer dependency
    const { SqliteSaver } = await import('@langchain/langgraph-checkpoint-sqlite');

    // Create the checkpointer
    const checkpointer = SqliteSaver.fromConnString(path);

    // Run migrations if requested
    if (autoMigrate) {
      await checkpointer.setup();
    }

    return checkpointer;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      throw new Error(
        'SQLite checkpointer requires @langchain/langgraph-checkpoint-sqlite to be installed. ' +
          'Install it with: npm install @langchain/langgraph-checkpoint-sqlite'
      );
    }
    throw error;
  }
}

/**
 * Type guard to check if a checkpointer is a MemorySaver
 *
 * @param checkpointer - The checkpointer to check
 * @returns True if the checkpointer is a MemorySaver
 */
export function isMemoryCheckpointer(
  checkpointer: BaseCheckpointSaver
): checkpointer is MemorySaver {
  return checkpointer instanceof MemorySaver;
}

