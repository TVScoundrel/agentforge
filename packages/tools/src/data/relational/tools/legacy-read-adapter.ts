import {
  createLegacyRelationalReadToolSet,
  type RelationalToolSet,
  type RelationalToolSetOptions,
} from '../tool-set.js';
import type { DatabaseVendor } from '../types.js';

interface LegacyDatabaseInput {
  vendor: DatabaseVendor;
  connectionString: string;
}

export function replaceConnectionFailureMessage<T extends { success: boolean; error?: string }>(
  result: T,
  configuredMessage: string,
  legacyMessage: string
): T {
  if (!result.success && result.error === configuredMessage) {
    return { ...result, error: legacyMessage };
  }
  return result;
}

export async function withEphemeralRelationalToolSet<T>(
  database: LegacyDatabaseInput,
  invoke: (toolSet: RelationalToolSet) => Promise<T>,
  options: RelationalToolSetOptions = {},
  sharedSchemaCacheKey?: string
): Promise<T> {
  const config = { vendor: database.vendor, connection: database.connectionString } as const;
  const toolSet = createLegacyRelationalReadToolSet(config, options, sharedSchemaCacheKey);

  try {
    return await invoke(toolSet);
  } finally {
    await toolSet.dispose();
  }
}
