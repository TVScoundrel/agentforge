import type { Session } from 'neo4j-driver';

import { neo4jPool } from '../connection.js';

export async function withNeo4jSession<T>(
  database: string | undefined,
  operation: (session: Session) => Promise<T>
): Promise<T> {
  const session = neo4jPool.getSession(database);

  try {
    return await operation(session);
  } finally {
    await session.close();
  }
}
