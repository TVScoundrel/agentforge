/**
 * Web Search Tool - Utility Functions
 */

import type { RetryConfig } from './types.js';

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

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

/**
 * Default timeout for search requests (30 seconds)
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Check if error is retryable (network errors, timeouts, 5xx errors)
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return true;
  }

  // 5xx server errors (but not 4xx client errors)
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  // Rate limiting (429) - retryable with backoff
  if (error.response?.status === 429) {
    return true;
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted all attempts
      if (attempt === config.maxRetries) {
        break;
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }

  // All retries exhausted
  throw lastError;
}

