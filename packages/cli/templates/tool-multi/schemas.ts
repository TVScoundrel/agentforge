import { z } from 'zod';

/**
 * Zod schema for {{TOOL_NAME}} tool input validation
 */
export const {{TOOL_NAME_PASCAL}}Schema = z.object({
  /**
   * Input parameter
   * TODO: Define your input schema
   */
  input: z.string()
    .min(1, 'Input cannot be empty')
    .describe('Input parameter'),
});

/**
 * Infer the input type from the schema
 */
export type {{TOOL_NAME_PASCAL}}Input = z.infer<typeof {{TOOL_NAME_PASCAL}}Schema>;

