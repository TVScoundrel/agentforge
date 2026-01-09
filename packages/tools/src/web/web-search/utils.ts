/**
 * Web Search Tool - Utility Functions
 */

/**
 * Get Serper API key from environment
 */
export function getSerperApiKey(): string | undefined {
  return process.env.SERPER_API_KEY;
}

/**
 * Check if Serper API is available
 */
export function isSerperAvailable(): boolean {
  return !!getSerperApiKey();
}

/**
 * Measure execution time of an async function
 */
export async function measureTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}

/**
 * Sanitize search query
 */
export function sanitizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

