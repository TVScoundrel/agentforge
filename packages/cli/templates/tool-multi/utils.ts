/**
 * Utility functions for {{TOOL_NAME}} tool
 */

/**
 * Delay execution for a specified number of milliseconds
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format error message
 * 
 * @param error - Error object or message
 * @returns Formatted error message
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Validate environment variable
 * 
 * @param name - Environment variable name
 * @returns Environment variable value
 * @throws Error if environment variable is not set
 */
export function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get optional environment variable
 * 
 * @param name - Environment variable name
 * @returns Environment variable value or undefined
 */
export function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

