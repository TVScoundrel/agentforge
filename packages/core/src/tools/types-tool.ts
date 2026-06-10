import type { z } from 'zod';
import type { ToolMetadata } from './types-metadata.js';

/**
 * Complete tool contract combining metadata, input schema, and invocation API.
 */
export interface Tool<TInput = unknown, TOutput = unknown> {
  metadata: ToolMetadata;
  schema: z.ZodSchema<TInput>;
  invoke: (input: TInput) => Promise<TOutput>;
  /**
   * @deprecated Use `invoke` instead.
   */
  execute?: (input: TInput) => Promise<TOutput>;
}
