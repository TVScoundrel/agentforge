import { createLegacyRelationalMutationToolSet, type RelationalToolSet } from '../tool-set.js';
import type { DatabaseVendor } from '../types.js';
import { MissingPeerDependencyError } from '../utils/peer-dependency-checker.js';

interface LegacyDatabaseInput {
  vendor: DatabaseVendor;
  connectionString: string;
}

export function replaceMutationConnectionFailure<T extends { success: boolean; error?: string }>(
  result: T,
  configuredMessage: string,
  legacyMessage: string
): T {
  if (!result.success && result.error === configuredMessage) {
    return { ...result, error: legacyMessage };
  }
  return result;
}

export async function withEphemeralRelationalMutationToolSet<T>(
  database: LegacyDatabaseInput,
  invoke: (toolSet: RelationalToolSet) => Promise<T>,
  toErrorResponse: (error: unknown) => T
): Promise<T> {
  const toolSet = createLegacyRelationalMutationToolSet({
    vendor: database.vendor,
    connection: database.connectionString,
  });

  try {
    try {
      return await invoke(toolSet);
    } catch (error) {
      if (error instanceof MissingPeerDependencyError) {
        throw error;
      }
      return toErrorResponse(error);
    }
  } finally {
    await toolSet.dispose();
  }
}
