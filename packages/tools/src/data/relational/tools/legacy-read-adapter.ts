import {
  createRelationalToolSet,
  type RelationalToolSet,
  type RelationalToolSetOptions,
} from '../tool-set.js';
import type { DatabaseVendor } from '../types.js';

interface LegacyDatabaseInput {
  vendor: DatabaseVendor;
  connectionString: string;
}

export async function withEphemeralRelationalToolSet<T>(
  database: LegacyDatabaseInput,
  invoke: (toolSet: RelationalToolSet) => Promise<T>,
  options: RelationalToolSetOptions = {}
): Promise<T> {
  const toolSet = createRelationalToolSet(
    { vendor: database.vendor, connection: database.connectionString },
    options
  );

  try {
    return await invoke(toolSet);
  } finally {
    await toolSet.dispose();
  }
}
