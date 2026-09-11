import { createLegacyRelationalMutationToolSet, type RelationalToolSet } from '../tool-set.js';
import type { DatabaseVendor } from '../types.js';

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
  invoke: (toolSet: RelationalToolSet) => Promise<T>
): Promise<T> {
  const toolSet = createLegacyRelationalMutationToolSet({
    vendor: database.vendor,
    connection: database.connectionString,
  });

  try {
    return await invoke(toolSet);
  } finally {
    await toolSet.dispose();
  }
}
