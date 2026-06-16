/**
 * Internal runtime helpers for batch execution flows.
 */

import { createLogger } from '@agentforge/core';

export const batchExecutionLogger = createLogger('agentforge:tools:data:relational:batch');

export function toBatchErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function delayBatchRetry(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
