/**
 * Web Search Tool - Zod Schemas
 */

import { z } from 'zod';

/**
 * Web search input schema
 */
export const webSearchSchema = z.object({
  query: z.string().min(1).describe('The search query'),
  maxResults: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of results to return (1-50)'),
  preferSerper: z
    .boolean()
    .default(false)
    .describe('Prefer Serper API if available (requires SERPER_API_KEY)'),
  timeout: z
    .number()
    .min(1000)
    .max(60000)
    .default(30000)
    .describe('Request timeout in milliseconds (1000-60000, default: 30000)'),
});

/**
 * Search result schema
 */
export const searchResultSchema = z.object({
  title: z.string(),
  link: z.string().url(),
  snippet: z.string(),
  position: z.number().optional(),
});

/**
 * Web search output schema
 */
export const webSearchOutputSchema = z.object({
  success: z.boolean(),
  source: z.enum(['duckduckgo', 'serper']),
  query: z.string(),
  results: z.array(searchResultSchema),
  totalResults: z.number().optional(),
  error: z.string().optional(),
  metadata: z
    .object({
      responseTime: z.number().optional(),
      fallbackUsed: z.boolean().optional(),
    })
    .optional(),
});

